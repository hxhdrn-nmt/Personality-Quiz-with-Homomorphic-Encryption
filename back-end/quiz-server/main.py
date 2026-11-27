from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import calculation

server = FastAPI()

origins = [
    "http://localhost:5173",
    "https://finished-excluding-afar.ngrok-free.dev",
]

# @server.middleware("http")
# async def add_pna_header(request: Request, call_next):
#     response = await call_next(request)
#     if (
#         request.headers.get("access-control-request-private-network")
#         == "true"
#     ):
#         response.headers["Access-Control-Allow-Private-Network"] = "true"
#     return response

server.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuizAnswers(BaseModel):
    encrypted: bool
    n: int
    g: int
    answers: list[int]

class QuizResults(BaseModel):
    result: str


@server.post("/results/")
def score(data: QuizAnswers) -> QuizResults:
    try:
        res = calculation.calc_results(data.encrypted, data.n, data.g, data.answers)
        if (res == -1):
            raise HTTPException(status_code=400, detail="Data Error")
        return QuizResults(result=str(res))
    except NameError as e:
        raise HTTPException(status_code=500, detail="Name Error: " + str(e))
    except ValueError:
        raise HTTPException(status_code=500, detail="Value Error")
    except ZeroDivisionError:
        raise HTTPException(status_code=500, detail="Zero Division Error")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Unknown Server Error: " + str(e))