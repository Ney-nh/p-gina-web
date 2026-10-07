"""
D.I.R.T. Comunitario — API de movimientos de alimentos.

Cambios respecto a la versión anterior:
  - Se elimina por completo la autenticación con Google (Emergent Auth).
    Ya no hay colecciones `users` ni `user_sessions`, ni endpoints /auth/*.
  - Los endpoints quedan abiertos: el registro se identifica con el nombre y
    el documento que escribe la persona, igual que en la app de App Inventor.
  - Se corrige la configuración de CORS (allow_origins="*" con
    allow_credentials=True es inválida para los navegadores).
  - Se añade el campo `compuerta_abierta` para dejar constancia de si el
    movimiento accionó físicamente la compuerta del Arduino.
"""

import logging
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated, List, Literal, Optional

from bson import ObjectId
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, BeforeValidator, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url, tz_aware=True)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="D.I.R.T. Comunitario")
api_router = APIRouter(prefix="/api")

TIPOS = ("entrada", "salida")
CATEGORIAS = ("lacteos", "frutas", "fritos", "bebidas")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Modelos
# ---------------------------------------------------------------------------
def str_objectid(value):
    """Convierte un ObjectId de BSON en su representación str."""
    return str(value) if isinstance(value, ObjectId) else value


PyObjectId = Annotated[str, BeforeValidator(str_objectid)]


class BaseDocument(BaseModel):
    """Base para documentos de Mongo: mapea _id (ObjectId) -> id (str)."""

    id: Optional[PyObjectId] = None

    def to_mongo(self) -> dict:
        data = self.model_dump(exclude={"id"})
        data["_id"] = ObjectId()
        return data

    @classmethod
    def from_mongo(cls, doc: dict):
        data = dict(doc)
        raw_id = data.pop("_id", None)
        data["id"] = str(raw_id) if raw_id is not None else None
        return cls(**data)


class Movimiento(BaseDocument):
    tipo: Literal["entrada", "salida"]
    nombre: str
    documento: str
    categoria: Literal["lacteos", "frutas", "fritos", "bebidas"]
    cantidad: int = Field(default=1, ge=1, le=999)
    nota: Optional[str] = None
    # Deja constancia de si este movimiento accionó la compuerta del Arduino.
    compuerta_abierta: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    deleted_at: Optional[datetime] = None


class MovimientoCreate(BaseModel):
    tipo: Literal["entrada", "salida"]
    nombre: str = Field(min_length=2, max_length=80)
    documento: str = Field(min_length=3, max_length=20)
    categoria: Literal["lacteos", "frutas", "fritos", "bebidas"]
    cantidad: int = Field(default=1, ge=1, le=999)
    nota: Optional[str] = Field(default=None, max_length=200)
    compuerta_abierta: bool = False


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"message": "D.I.R.T. Comunitario API", "status": "ok"}


@api_router.post(
    "/movimientos",
    response_model=Movimiento,
    status_code=201,
    response_model_exclude_none=True,
)
async def crear_movimiento(input: MovimientoCreate):
    movimiento = Movimiento(**input.model_dump())
    result = await db.movimientos.insert_one(movimiento.to_mongo())
    movimiento.id = str(result.inserted_id)
    return movimiento


@api_router.get(
    "/movimientos",
    response_model=List[Movimiento],
    response_model_exclude_none=True,
)
async def listar_movimientos(
    tipo: Optional[Literal["entrada", "salida"]] = None,
    categoria: Optional[Literal["lacteos", "frutas", "fritos", "bebidas"]] = None,
    q: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=500),
):
    query: dict = {"deleted_at": None}
    if tipo:
        query["tipo"] = tipo
    if categoria:
        query["categoria"] = categoria
    if q and q.strip():
        termino = re.escape(q.strip())
        query["$or"] = [
            {"nombre": {"$regex": termino, "$options": "i"}},
            {"documento": {"$regex": termino, "$options": "i"}},
        ]
    docs = await db.movimientos.find(query).sort("created_at", -1).to_list(limit)
    return [Movimiento.from_mongo(d) for d in docs]


@api_router.get("/movimientos/resumen")
async def resumen():
    ahora = datetime.now(timezone.utc)
    inicio_hoy = ahora.replace(hour=0, minute=0, second=0, microsecond=0)
    por_categoria = {
        cat: {"entradas": 0, "salidas": 0, "stock": 0, "ultima": None}
        for cat in CATEGORIAS
    }
    total = 0
    entradas_hoy = 0
    salidas_hoy = 0
    aperturas_hoy = 0

    async for doc in db.movimientos.find({"deleted_at": None}):
        cat = doc.get("categoria")
        if cat not in por_categoria:
            continue
        total += 1
        tipo = doc.get("tipo")
        cantidad = doc.get("cantidad") or 0
        created = doc.get("created_at")
        de_hoy = bool(created and created >= inicio_hoy)

        if tipo == "entrada":
            por_categoria[cat]["entradas"] += cantidad
            if de_hoy:
                entradas_hoy += 1
        elif tipo == "salida":
            por_categoria[cat]["salidas"] += cantidad
            if de_hoy:
                salidas_hoy += 1

        if de_hoy and doc.get("compuerta_abierta"):
            aperturas_hoy += 1

        ultima = por_categoria[cat]["ultima"]
        if created and (ultima is None or created > ultima):
            por_categoria[cat]["ultima"] = created

    for cat in CATEGORIAS:
        datos = por_categoria[cat]
        datos["stock"] = datos["entradas"] - datos["salidas"]

    return {
        "hoy": {
            "entradas": entradas_hoy,
            "salidas": salidas_hoy,
            "aperturas": aperturas_hoy,
        },
        "total_movimientos": total,
        "por_categoria": por_categoria,
    }


@api_router.delete("/movimientos/{movimiento_id}")
async def eliminar_movimiento(movimiento_id: str):
    if not ObjectId.is_valid(movimiento_id):
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    result = await db.movimientos.update_one(
        {"_id": ObjectId(movimiento_id), "deleted_at": None},
        {"$set": {"deleted_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return {"ok": True, "id": movimiento_id}


# ---------------------------------------------------------------------------
# Arranque
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def crear_indices():
    # Índices que sostienen el listado ordenado y los filtros del historial.
    await db.movimientos.create_index([("created_at", -1)])
    await db.movimientos.create_index("categoria")
    await db.movimientos.create_index("tipo")
    await db.movimientos.create_index("deleted_at")
    logger.info("Índices de movimientos verificados")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


app.include_router(api_router)

# CORS: con allow_credentials=True el comodín "*" es inválido en los
# navegadores. Como ya no usamos cookies ni cabecera Authorization, las
# credenciales se desactivan y el comodín queda permitido. Para restringir
# el acceso en producción, define ALLOWED_ORIGINS en el .env separando las
# URLs con comas.
origenes_env = os.environ.get("ALLOWED_ORIGINS", "").strip()
origenes = [o.strip() for o in origenes_env.split(",") if o.strip()] or ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=origenes,
    allow_methods=["*"],
    allow_headers=["*"],
)
