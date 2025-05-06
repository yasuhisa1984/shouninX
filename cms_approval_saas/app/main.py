from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import form, request  # 👈 これ重要！

app = FastAPI()

# ✅ FastAPIインスタンスの後に書く！
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(form.router)
app.include_router(request.router)

@app.get("/")
def root():
    return {"message": "Hello CMS SaaS"}
