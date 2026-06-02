package org.hosix.optaplanner.solver

data class Clinician(
    val id: String,
    val nombre: String? = null,
    val especialidades: List<String> = emptyList(),
    val ubicacion: String? = null,
    val estaEnTurno: Boolean = true,
    val activo: Boolean = true
)

data class Patient(
    val id: String,
    val nombre: String? = null,
    val tipo: String? = null,
    val prioridad: String = "normal",
    val especialidadNecesaria: String? = null,
    val esEmbarazada: Boolean = false,
    val createdAt: String? = null
)

data class Event(
    val type: String,
    val source: String? = null,
    val timestamp: String? = null,
    val details: Map<String, Any>? = null
)

data class SolverPayload(
    val clinicians: List<Clinician> = emptyList(),
    val patients: List<Patient> = emptyList(),
    val horizonMinutes: Int = 60,
    val events: List<Event> = emptyList()
)

data class AssignmentResult(
    val ticketId: String,
    val clinicianId: String?,
    val consultorio: String? = null,
    val order: Int,
    val score: Int
)

data class SolverResponse(
    val assignments: List<AssignmentResult>
)
