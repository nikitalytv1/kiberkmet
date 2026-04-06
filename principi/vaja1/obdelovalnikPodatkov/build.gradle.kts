plugins {
    kotlin("jvm") version "2.3.0"
}

group = "org.example"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {
    dependencies {
        // Jackson Core za streaming parsing
        implementation("com.fasterxml.jackson.core:jackson-core:2.15.2")

        // Jackson Databind za mapiranje JSON → Object
        implementation("com.fasterxml.jackson.core:jackson-databind:2.15.2")

        // Jackson Kotlin modul za Kotlin data class
        implementation("com.fasterxml.jackson.module:jackson-module-kotlin:2.15.2")
    }
    testImplementation(kotlin("test"))
}

kotlin {
    jvmToolchain(24)
}

tasks.test {
    useJUnitPlatform()
}