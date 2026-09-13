# Web de Clínica Dental con Gestión de Citas

## Qué construiremos

Una web completa para una clínica dental con reserva de citas en tiempo real, área de paciente y panel privado de gestión para la clínica.

### Web pública
- **Inicio** (`/`): presentación de la clínica, llamada a reservar cita, destacados de tratamientos y equipo.
- **Tratamientos** (`/tratamientos`): listado de servicios (limpieza, ortodoncia, implantes, estética, etc.) con descripción y precio orientativo.
- **Equipo** (`/equipo`): doctores con foto, especialidad y breve bio.
- **Contacto** (`/contacto`): horario, teléfono, dirección con mapa y formulario de contacto validado.
- **Reservar cita** (`/reservar`): flujo paso a paso — elegir tratamiento → elegir doctor → ver calendario con huecos libres por día → confirmar. Requiere cuenta (registro/login en línea si no hay sesión).

### Área de paciente (privada, `/mis-citas`)
- Ver citas próximas y pasadas.
- Cancelar una cita próxima.

### Panel de clínica (privado, `/admin`)
- Agenda del día/semana con todas las citas.
- Confirmar, cancelar o marcar citas como completadas.
- Vista por doctor.
- Acceso solo para usuarios con rol `admin` (tabla `user_roles` + función `has_role`).

## Diseño
- Dirección visual limpia y sanitaria: fondo claro, acento en verde azulado (teal), tipografía moderna, tarjetas suaves.
- Diseño adaptable a móvil y escritorio.
- SEO: título y descripción únicos por página, metadatos OG, HTML semántico.

## Detalles técnicos
- **Lovable Cloud** activado: base de datos, autenticación por email y almacenamiento.
- **Tablas**: `profiles` (datos del paciente, auto-creada por trigger), `treatments`, `doctors`, `doctor_schedules` (horario semanal por doctor), `appointments` (con estados: pendiente/confirmada/cancelada/completada), `user_roles` (roles admin separados, con función `has_role` security-definer). GRANTs y RLS en todas las tablas.
- **Disponibilidad**: función en base de datos que calcula huecos libres cruzando horario del doctor, citas existentes y duración del tratamiento; huecos de 30 min, sin citas solapadas (constraint de exclusión).
- **Auth**: email/contraseña (se activará email auth), página `/auth` con login y registro, página `/reset-password`; rutas privadas bajo el layout `_authenticated` gestionado por la integración.
- **Datos iniciales**: migración con INSERTs de tratamientos, doctores y horarios de ejemplo para que la agenda funcione desde el primer momento.
- **Imágenes**: generadas (hero de la clínica, fotos del equipo) e integradas en la web.
- **Validación**: zod en cliente y servidor en todos los formularios.

## Datos de ejemplo (marcados para que los cambies)
Nombre de clínica, teléfono, dirección, horario y doctores serán de muestra; te pediré confirmar los reales al final si quieres sustituirlos.
