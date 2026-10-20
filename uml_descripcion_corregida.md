# 📐 Descripción UML — TuViajeST (Corregido)

> Basado en análisis de: `firebase.js`, `AuthContext.jsx`, `DataContext.jsx`, `userService.js`

---

## ❌ Errores encontrados en el diagrama original

| Clase | Campo incorrecto | Corrección |
|-------|-----------------|------------|
| `FirebaseService` | `auth: FirabeasAuth` | `auth: FirebaseAuth` (typo) |
| `User` | `sedeId: String` | `branch: String` (nombre real en Firestore) |
| `Student` | `career: String` | `grade: String` (nombre real en Firestore) |
| `Student` | `sedeId: String` | `branch: String` (nombre real en Firestore) |
| `AdminDashboard` | `selectedSede: String` | `selectedBranch: String` (consistencia) |

---

## 📦 Clases (descripción para recrear el diagrama)

### Clase 1: `User`
**Atributos:**
- `userId: String`
- `name: String`
- `email: String`
- `role: String` *(valores: "admin" | "director" | "coordinator" | "assistant")*
- `branch: String` ← *(era `sedeId`, corregido)*

**Métodos:**
- `isAuthenticated(): Boolean`
- `hasRole(role): Boolean`
- `isAdminOrDirector(): Boolean`

---

### Clase 2: `AdminDashboard`
**Atributos:**
- `currentAdmin: User`
- `totalStudents: Int`
- `totalPines: Int`
- `selectedBranch: String` ← *(era `selectedSede`, corregido)*

**Métodos:**
- `createStudent(studentData)`
- `importStudents(file)`
- `createUsuario(userData)`
- `viewSedeDetails(branch)`

---

### Clase 3: `FirebaseService`
**Atributos:**
- `db: Firestore`
- `auth: FirebaseAuth` ← *(era `FirabeasAuth`, typo corregido)*
- `localCache: PersistentCache`

**Métodos:**
- `fetchStudents()`
- `savePin(pinData)`
- `updateSedeMetrics()`
- `authenticateUser(credentials)`

---

### Clase 4: `Student`
**Atributos:**
- `rut: String`
- `name: String`
- `grade: String` ← *(era `career`, corregido)*
- `jornada: String`
- `branch: String` ← *(era `sedeId`, corregido)*
- `institutionType: String` *(campo real, faltaba en el diagrama)*
- `avatar: String` *(campo real, faltaba en el diagrama)*
- `pinesObtenidos: Int`
- `pinesDisponibles: Int`

**Métodos:**
- `getProfile(): Object`
- `updatePinesCount()`

---

### Clase 5: `Sede`
*(Clase conceptual — no es una colección directa en Firestore, es un agrupador lógico de estudiantes por `branch`)*

**Atributos:**
- `sedeId: String`
- `name: String`
- `totalEstudiantes: Int`
- `pinesEntregados: Int`

**Métodos:**
- `getSedeMetrics()`

---

### Clase 6: `PinCard`
**Atributos:**
- `pinId: String`
- `name: String`
- `category: String`
- `description: String`
- `isCollected: Boolean`
- `isAvailable: Boolean`
- `icon: String`

**Métodos:**
- `isClickable(): Boolean`
- `unlock()`

---

## 🔗 Relaciones entre clases

| Origen | Tipo | Destino | Descripción |
|--------|------|---------|-------------|
| `AdminDashboard` | Asociación → | `User` | El dashboard pertenece a un admin |
| `AdminDashboard` | Asociación → | `FirebaseService` | Usa Firebase para leer/escribir |
| `AdminDashboard` | Asociación → | `Student` | Crea y gestiona estudiantes |
| `AdminDashboard` | Asociación → | `Sede` | Visualiza métricas por sede |
| `Student` | Asociación → | `Sede` | Pertenece a una sede (`branch`) |
| `Student` | Composición → | `PinCard` | Tiene pines asociados |
| `Sede` | Asociación → | `PinCard` | Entrega pines a estudiantes |
