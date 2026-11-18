# 🦷 Clínica Dental — Plataforma Web

Sistema modular para clínica dental. Construido con React + Node.js + PostgreSQL, desplegado en Render.

---

## Estructura del proyecto

```
dental-clinic/
  backend/          ← API (Node.js + Express + Prisma)
  frontend/         ← Interfaz (React + Vite + Tailwind)
  README.md
```

---

## Paso a paso para poner en marcha

### 1. Requisitos previos
- Instalar [Node.js](https://nodejs.org) (versión 18 o superior)
- Tener una cuenta en [GitHub](https://github.com)
- Tener una cuenta en [Render](https://render.com)

---

### 2. Preparar el repositorio en GitHub

1. Entra a github.com y crea un repositorio nuevo llamado `dental-clinic`
2. En tu computadora, abre una terminal dentro de esta carpeta `dental-clinic`
3. Ejecuta:

```bash
git init
git add .
git commit -m "Estructura inicial del proyecto"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/dental-clinic.git
git push -u origin main
```

---

### 3. Instalar dependencias y probar en local

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
# Edita .env con tu base de datos local si tienes una
npx prisma generate
npm run dev
```

**Frontend (en otra terminal):**
```bash
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173 en tu navegador.

---

### 4. Crear la base de datos en Render

1. Entra a [render.com](https://render.com)
2. Clic en **New +** → **PostgreSQL**
3. Ponle nombre: `dental-clinic-db`
4. Plan: **Free**
5. Clic en **Create Database**
6. Copia el valor de **External Database URL** — lo necesitas en el siguiente paso

---

### 5. Desplegar el Backend en Render

1. Clic en **New +** → **Web Service**
2. Conecta tu repositorio de GitHub
3. Configuración:
   - **Name:** `dental-clinic-api`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command:** `npm start`
4. En **Environment Variables** agrega:
   - `DATABASE_URL` → el valor que copiaste en el paso anterior
   - `JWT_SECRET` → cualquier texto largo y secreto (ej: `miClaveSuperSecreta2026`)
5. Clic en **Create Web Service**
6. Espera que diga **Live** — copia la URL (algo como `https://dental-clinic-api.onrender.com`)

---

### 6. Desplegar el Frontend en Render

1. Clic en **New +** → **Static Site**
2. Conecta el mismo repositorio
3. Configuración:
   - **Name:** `dental-clinic-app`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. En **Environment Variables** agrega:
   - `VITE_API_URL` → la URL del backend del paso anterior + `/api`
     (ej: `https://dental-clinic-api.onrender.com/api`)
5. Clic en **Create Static Site**
6. Cuando diga **Live**, ya puedes entrar a la URL y usar el sistema

---

### 7. Crear el primer usuario (admin)

Una vez desplegado, llama a este endpoint desde el navegador o Postman:

```
POST https://dental-clinic-api.onrender.com/api/auth/register
Content-Type: application/json

{
  "name": "Administrador",
  "email": "admin@clinica.com",
  "password": "tu_contraseña",
  "role": "ADMIN"
}
```

Luego entra al sistema con ese correo y contraseña.

---

## Módulos incluidos en esta versión

| Módulo | Estado |
|---|---|
| Login y seguridad | ✅ Listo |
| Panel principal | ✅ Listo |
| Gestión de pacientes | ✅ Listo |
| Agenda y citas | ✅ Listo |
| Odontograma | 🔜 Próximo |
| Tratamientos | 🔜 Próximo |
| Finanzas | 🔜 Próximo |
| Inventario | 🔜 Próximo |

---

## Notas importantes

- El plan **Free** de Render apaga el backend si no lo usan por 15 minutos. Para producción real, usa el plan **Starter** ($7/mes).
- Los `.env` nunca deben subirse a GitHub — ya están en `.gitignore`.
