import org.jetbrains.compose.desktop.application.dsl.TargetFormat

plugins {
    alias(libs.plugins.kotlinMultiplatform)
    alias(libs.plugins.composeMultiplatform)
    alias(libs.plugins.composeCompiler)
    alias(libs.plugins.composeHotReload)
}

kotlin {
    jvm()
    jvmToolchain(17)
    sourceSets {
        commonMain.dependencies {
            implementation(compose.materialIconsExtended)
            implementation("io.github.serpro69:kotlin-faker:1.16.1")
            implementation("com.fasterxml.jackson.core:jackson-core:2.15.2")
            implementation("com.fasterxml.jackson.core:jackson-databind:2.15.2")
            implementation("com.fasterxml.jackson.module:jackson-module-kotlin:2.15.2")
            implementation(libs.compose.runtime)
            implementation(libs.compose.foundation)
            implementation(libs.compose.material3)
            implementation(libs.compose.ui)
            implementation(libs.compose.components.resources)
            implementation(libs.compose.uiToolingPreview)
            implementation(libs.androidx.lifecycle.viewmodelCompose)
            implementation(libs.androidx.lifecycle.runtimeCompose)
        }
        commonTest.dependencies {
            implementation(libs.kotlin.test)
        }
        jvmMain.dependencies {
            implementation(compose.desktop.currentOs)
            implementation(libs.kotlinx.coroutinesSwing)
        }
    }
}


compose.desktop {
    application {
        mainClass = "org.example.vaja2.MainKt"

        nativeDistributions {
            targetFormats(TargetFormat.Dmg, TargetFormat.Msi, TargetFormat.Deb)
            packageName = "org.example.vaja2"
            packageVersion = "1.0.0"
        }
    }
}
