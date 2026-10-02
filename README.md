# BluePrints en Tiempo Real (Sockets & STOMP)

Front en React + Vite integrado con nuestra API CRUD (Lab 4) y colaboración en vivo por **STOMP** (Spring Boot).
Varias pestañas que tienen abierto el mismo plano ven aparecer los puntos de los demás sin recargar.

## Estructura del proyecto

```
.
├── docker-compose.yml   # Postgres para el CRUD
├── Laboratory_4/        # Backend CRUD — Spring Boot, JWT + Postgres (puerto 8080)
├── backend-stomp/       # Backend RT — Spring Boot, broker STOMP sobre WebSocket (puerto 8081)
└── QuintoLab_ARSW/      # Front — React + Vite + Redux: login, CRUD, canvas y tiempo real (puerto 5173)
```

## Cómo ejecutar todo

Requisitos: Java 21 + Maven, Node 20+, Docker.

```bash
# 1. Postgres (desde la raíz)
docker compose up -d

# 2. Backend CRUD → http://localhost:8080
cd Laboratory_4 && mvn spring-boot:run

# 3. Backend STOMP → http://localhost:8081 (endpoint WS: /ws-blueprints)
cd backend-stomp && mvn spring-boot:run

# 4. Front → http://localhost:5173
cd QuintoLab_ARSW
cp .env.example .env.local
npm install
npm run dev
```

Variables del front (`QuintoLab_ARSW/.env.local`):

| Variable | Valor por defecto | Uso |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080/api` | API CRUD (equivale a `VITE_API_BASE` de la guía) |
| `VITE_USE_MOCK` | `false` | `true` usa datos en memoria, sin backend |
| `VITE_STOMP_BASE` | `http://localhost:8081` | Broker STOMP |

Health checks: `GET http://localhost:8080/actuator/health` y `GET http://localhost:8081/actuator/health`.


## Endpoints usados

**REST (Laboratory_4)**. Todos requieren `Authorization: Bearer <token>`. Lectura: scope `blueprints.read`. Escritura: `blueprints.write`.

| Método | Ruta | Uso en el front |
|---|---|---|
| `POST` | `/auth/login` | Login, devuelve el JWT |
| `GET` | `/api/v1/blueprints` | Autores conocidos (autocompletar) |
| `GET` | `/api/v1/blueprints/{author}` | Tabla del autor + **total de puntos** (`reduce`) |
| `GET` | `/api/v1/blueprints/{author}/{name}` | Estado inicial del canvas |
| `POST` | `/api/v1/blueprints` | Crear |
| `PUT` | `/api/v1/blueprints/{author}/{name}` | Guardar (reemplaza los puntos) |
| `DELETE` | `/api/v1/blueprints/{author}/{name}` | Eliminar |

La guía propone `GET /api/blueprints?author=` para listar por autor. Nosotros usamos la ruta versionada `/api/v1/blueprints/{author}` del Lab 4. El total de puntos se calcula en el cliente.

**Tiempo real (backend-stomp)**

| Dirección | Destino | Payload |
|---|---|---|
| cliente → servidor | `/app/draw` | `{ author, name, point: { x, y } }` |
| servidor → clientes | `/topic/blueprints.{author}.{name}` | `{ author, name, points: [ { x, y } ] }` |

## Decisiones de diseño

- **Un tópico por plano** (`blueprints.{author}.{name}`). Así los planos quedan aislados entre sí: solo reciben el punto quienes tienen abierto ese plano. Al cambiar de plano, el front cancela la suscripción anterior y se suscribe a la nueva.
- **Dos backends separados.** El CRUD (8080) es dueño de la persistencia y del JWT. El broker (8081) solo retransmite. Los puntos dibujados en vivo **no se persisten solos**: quedan como cambios pendientes en cada pestaña, y se guardan en Postgres con **Guardar cambios** (`PUT`).
- **Eco como confirmación.** Con STOMP conectado, el click se publica y el punto se dibuja cuando vuelve por el tópico, también en la pestaña que lo envió. Así todas las pestañas aplican los puntos en el mismo orden y no hay duplicados. Sin conexión (o con el selector en **None**), el punto se dibuja solo en local.
- **Validación en el broker.** Se descartan (con un log `WARN`) los eventos sin punto, con coordenadas negativas o con `author`/`name` que tengan caracteres fuera de letras, números, espacio, `-` o `_`. Esto evita, por ejemplo, que un nombre con `.` publique en el tópico de otro plano.
- **Orígenes restringidos.** El handshake WebSocket solo acepta `http://localhost:5173`. En producción se configura con `BLUEPRINTS_ALLOWED_ORIGINS`. El CORS del CRUD también está limitado a ese origen.
- **Selector RT** en la UI: *None* / *STOMP*, con un indicador de estado (*conectando*, *en vivo*, *sin conexión*). No incluimos Socket.IO porque la guía pide elegir una de las dos tecnologías.

## Análisis (latencia y reconexión)

- **Latencia:** en local, entre dos clientes STOMP, un punto tarda ~30 ms desde `publish` hasta que llega al otro suscriptor (medido con dos clientes `@stomp/stompjs` contra `backend-stomp`). En la práctica se percibe instantáneo.
- **Reconexión:** el cliente usa `reconnectDelay: 1000` y heartbeats de 10 s. Si el broker se cae, la UI muestra *sin conexión (reintentando)*, se puede seguir dibujando en local y, cuando el broker vuelve, el cliente se resuscribe solo. Los puntos que otros dibujaron durante la caída **no** se reciben, porque el broker no guarda historial. Para recuperarlos hay que volver a abrir el plano después de que se guarde.
- **Observabilidad:** el broker registra conexión, suscripción (con el tópico), desconexión y payloads descartados. El front registra en consola la suscripción y los errores STOMP.

### Socket.IO vs STOMP (breve)

| | Socket.IO (Node) | STOMP (Spring) |
|---|---|---|
| Modelo | Eventos + *rooms* (`join-room`, `draw-event`) | Destinos/tópicos (`/app/draw` → `/topic/...`) |
| Unirse a un canal | Evento explícito que maneja el servidor | `SUBSCRIBE` del protocolo, el broker lo resuelve |
| Fallback | Long-polling incluido | SockJS opcional |
| Encaje con nuestro stack | Otro runtime (Node) | Mismo stack Java/Spring que el CRUD |

Elegimos STOMP porque comparte stack con el Lab 4 y porque el broker simple de Spring ya resuelve suscripción y broadcast sin código propio.

## Pruebas

```bash
cd QuintoLab_ARSW && npm test    # Vitest: slice, canvas, páginas y colaboración RT (cliente STOMP simulado)
cd backend-stomp && mvn test     # validación de payloads del broker
```

## Usuarios de prueba

| Usuario | Contraseña | Permisos |
|---|---|---|
| `student` | `student123` | solo lectura |
| `assistant` | `assistant123` | lectura y escritura |

## Evidencia

### Login

![Antes del Login](Images/image.png)
![Login](Images/image2.png)
![Luego del Login](Images/image3.png)

### Creación de un blueprint

![creacion blueprint](Images/image4.png)

### Revisión de blueprints (listado y detalle)

![Listado, detalle y persistencia del blueprint creado anteriormente (nikolas - intento de corazon)](Images/image5.png)

### Tiempo real (2 pestañas)

![In real time imagen](Images/image6.png)

video in real time
https://drive.google.com/file/d/1VNxn7kbm5463MTy368vA2-gE9-iua18Z/view?usp=sharing

