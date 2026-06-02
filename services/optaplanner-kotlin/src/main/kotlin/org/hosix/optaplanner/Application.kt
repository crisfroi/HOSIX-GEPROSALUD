package org.hosix.optaplanner

import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.serialization.jackson.*
import io.ktor.server.routing.*
import io.ktor.server.response.*
import org.hosix.optaplanner.routes.solverRoutes

fun main() {
    embeddedServer(Netty, port = System.getenv("PORT")?.toInt() ?: 8080) {
        install(ContentNegotiation) {
            jackson()
        }
        routing {
            get("/health") {
                call.respond(mapOf("status" to "ok", "service" to "optaplanner-kotlin"))
            }
            solverRoutes()
        }
    }.start(wait = true)
}
