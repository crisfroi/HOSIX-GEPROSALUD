plugins {
    kotlin("jvm") version "1.9.10"
    application
    id("com.github.johnrengelman.shadow") version "8.3.1"
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("io.ktor:ktor-server-core-jvm:2.3.5")
    implementation("io.ktor:ktor-server-netty-jvm:2.3.5")
    implementation("io.ktor:ktor-server-content-negotiation-jvm:2.3.5")
    implementation("io.ktor:ktor-serialization-jackson-jvm:2.3.5")
    implementation("ch.qos.logback:logback-classic:1.4.11")
    implementation("org.optaplanner:optaplanner-core:9.0.0")
}

application {
    mainClass.set("org.hosix.optaplanner.ApplicationKt")
}

kotlin {
    jvmToolchain(17)
}

tasks.withType<com.github.jengelman.gradle.plugins.shadow.tasks.ShadowJar> {
    archiveFileName.set("optaplanner-kotlin-all.jar")
    mergeServiceFiles()
}
