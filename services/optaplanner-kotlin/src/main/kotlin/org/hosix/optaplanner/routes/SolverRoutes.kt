package org.hosix.optaplanner.routes

import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.hosix.optaplanner.solver.SolverPayload
import org.hosix.optaplanner.solver.SolverResponse
import org.hosix.optaplanner.solver.solveQueue

fun Routing.solverRoutes() {
    route("/solve") {
        post {
            val payload = call.receive<SolverPayload>()
            val response = solveQueue(payload)
            call.respond(response)
        }
    }

    route("/event") {
        post {
            val event = call.receive<Map<String, Any>>()
            call.respond(mapOf("status" to "received", "event" to event))
        }
    }
}
