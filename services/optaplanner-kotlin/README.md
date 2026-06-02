# OptaPlanner Kotlin Microservice

Este servicio es un motor de optimización ligero pensado para resolver la cola de admisión y sala de espera en tiempo real.

## Qué hace
- expone `/health` para monitorización
- expone `/solve` para recibir el estado actual de pacientes y profesionales
- devuelve una asignación ordenada de tickets y consultorios

## Arquitectura recomendada
1. El backend principal recibe un evento de admisión / no presentación / médico retrasado.
2. Ese backend publica el evento en la cola de eventos o llama directamente a `/solve`.
3. El solver responde en < 1 segundo con la nueva orden de tickets.
4. El backend actualiza `hosix_tickets` y emite el cambio vía Supabase Realtime o WebSocket.

## Construir y ejecutar

```bash
cd services/optaplanner-kotlin
docker build -t hosix-optaplanner .
docker run --rm -p 8080:8080 hosix-optaplanner
```

## Uso

POST `/solve` con payload JSON:

```json
{
  "clinicians": [ ... ],
  "patients": [ ... ],
  "events": [ ... ]
}
```

Respuesta:

```json
{
  "assignments": [
    { "ticketId": "...", "clinicianId": "...", "consultorio": "A1", "order": 1, "score": 82 }
  ]
}
```
