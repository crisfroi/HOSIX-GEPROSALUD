package org.hosix.optaplanner.solver

fun solveQueue(payload: SolverPayload): SolverResponse {
    val availableClinicians = payload.clinicians.filter { it.estaEnTurno && it.activo }
    val sortedPatients = payload.patients.sortedWith(compareByDescending<Patient> {
        when (it.prioridad.lowercase()) {
            "urgente", "prioritario" -> 2
            "alta" -> 1
            else -> 0
        }
    }.thenByDescending { it.esEmbarazada }
      .thenBy { it.createdAt ?: "" })

    val assignments = mutableListOf<AssignmentResult>()
    var clinicianIndex = 0

    for ((index, patient) in sortedPatients.withIndex()) {
        val bestClinician = availableClinicians
            .filter { matchSpecialty(it, patient) }
            .minByOrNull { it.especialidades.size }
            ?: availableClinicians.getOrNull(clinicianIndex % availableClinicians.size)

        assignments.add(
            AssignmentResult(
                ticketId = patient.id,
                clinicianId = bestClinician?.id,
                consultorio = bestClinician?.ubicacion,
                order = index + 1,
                score = scoreAssignment(bestClinician, patient)
            )
        )

        if (availableClinicians.isNotEmpty()) {
            clinicianIndex++
        }
    }

    return SolverResponse(assignments = assignments)
}

private fun matchSpecialty(clinician: Clinician, patient: Patient): Boolean {
    return patient.especialidadNecesaria.isNullOrBlank() || clinician.especialidades.any {
        it.lowercase().contains(patient.especialidadNecesaria.lowercase())
    }
}

private fun scoreAssignment(clinician: Clinician?, patient: Patient): Int {
    if (clinician == null) return -1000
    var score = 0
    if (patient.prioridad.lowercase() in listOf("urgente", "prioritario", "alta")) score += 50
    if (patient.esEmbarazada) score += 30
    if (clinician.especialidades.any { it.lowercase().contains(patient.especialidadNecesaria?.lowercase() ?: "") }) score += 20
    return score
}
