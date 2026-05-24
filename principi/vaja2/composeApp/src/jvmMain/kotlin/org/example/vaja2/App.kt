package org.example.vaja2

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.Divider
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.HttpRequestBuilder
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.github.serpro69.kfaker.Faker
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlin.random.Random
import parser.FeatureItem
import parser.WeatherData
import parser.fetchWeatherData
import parser.loadGerkFeatures
import parser.mapRaba
import java.io.File
import javax.swing.JColorChooser

@Serializable
data class Parcel(
    val id: String,
    val name: String? = null,
    val color: String? = null,
    val gerk_pid: String? = null,
    val typeOfUse: String,
    val plannedCropName: String? = null,
    val plannedCropPercent: Double? = null,
    val cropPlans: List<CropPlan> = emptyList(),
    val coordinates: Coordinates,
    val areaHectares: Double? = null,
    val createdAt: String? = null,
    val userId: String? = null
)

@Serializable
data class CropPlan(
    val id: String,
    val cropName: String,
    val areaPercent: Double,
    val plantedAmountKg: Double? = null,
    val plantingDate: String? = null,
    val harvestDate: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null,
    val parcelaId: String? = null
)

@Serializable
data class Coordinates(
    val type: String,
    val coordinates: List<List<List<Double>>>
)

@Serializable
data class ParcelRequest(
    val name: String,
    val color: String? = null,
    val gerk_pid: String? = null,
    val typeOfUse: String,
    val plannedCropName: String? = null,
    val plannedCropPercent: Double? = null,
    val coordinates: Coordinates
)

@Serializable
data class CropPlanRequest(
    val cropName: String? = null,
    val areaPercent: Double? = null,
    val plantedAmountKg: Double? = null,
    val plantingDate: String? = null,
    val harvestDate: String? = null
)

data class CoordinatePoint(
    val longitude: String = "",
    val latitude: String = ""
)

data class RabaOption(
    val id: Int,
    val name: String
)

val rabaOptions = listOf(
    RabaOption(1100, "Njiva"),
    RabaOption(1160, "Hmeljišče"),
    RabaOption(1180, "Trajne rastline"),
    RabaOption(1190, "Rastlinjak"),
    RabaOption(1211, "Vinograd"),
    RabaOption(1212, "Matičnjak"),
    RabaOption(1221, "Intenzivni sadovnjak"),
    RabaOption(1222, "Ekstenzivni sadovnjak"),
    RabaOption(1230, "Oljčnik"),
    RabaOption(1240, "Ostali trajni nasadi"),
    RabaOption(1300, "Trajni travnik"),
    RabaOption(1321, "Barjanski travnik"),
    RabaOption(1410, "Zaraščajoče kmetijsko zemljišče"),
    RabaOption(1420, "Plantaža gozdnega drevja"),
    RabaOption(1500, "Drevesa in grmičevje"),
    RabaOption(1800, "KMZGO: kmetijsko z drevjem"),
    RabaOption(2000, "Gozd"),
    RabaOption(3000, "Pozidano"),
    RabaOption(4100, "Barje"),
    RabaOption(4210, "Trstje"),
    RabaOption(4220, "Ostalo zamočvirjeno"),
    RabaOption(5000, "Suho odprto"),
    RabaOption(6000, "Odprto"),
    RabaOption(7000, "Voda")
)

val cropOptions = listOf(
    "Pšenica",
    "Ječmen",
    "Koruza",
    "Sončnica",
    "Krompir",
    "Fižol",
    "Solata",
    "Paradižnik",
    "Laški rizling",
    "Sauvignon",
    "Jablana",
    "Sliva",
    "Lucerna",
    "Travna mešanica",
    "Smreka",
    "Bukev"
)

data class CropYieldInfo(
    val tonsPerHa: Double?,
    val seedRateKgPerHa: ClosedFloatingPointRange<Double>? = null
)

val cropYieldInfo = mapOf(
    "Pšenica" to CropYieldInfo(5.2, 180.0..260.0),
    "Ječmen" to CropYieldInfo(4.1, 150.0..220.0),
    "Koruza" to CropYieldInfo(8.7, 18.0..30.0),
    "Sončnica" to CropYieldInfo(3.0, 4.0..8.0),
    "Krompir" to CropYieldInfo(25.0, 1800.0..3000.0),
    "Fižol" to CropYieldInfo(2.4, 80.0..140.0),
    "Solata" to CropYieldInfo(18.0, 0.5..1.5),
    "Paradižnik" to CropYieldInfo(45.0, 0.1..0.3),
    "Laški rizling" to CropYieldInfo(8.0, 1800.0..3500.0),
    "Sauvignon" to CropYieldInfo(7.0, 1800.0..3500.0),
    "Jablana" to CropYieldInfo(35.0, 1200.0..2500.0),
    "Sliva" to CropYieldInfo(18.0, 1200.0..2500.0),
    "Lucerna" to CropYieldInfo(12.0, 20.0..35.0),
    "Travna mešanica" to CropYieldInfo(9.0, 25.0..45.0),
    "Smreka" to CropYieldInfo(null),
    "Bukev" to CropYieldInfo(null)
)

private object ApiConfig {
    val baseUrl: String =
        System.getProperty("kiberkmet.apiBaseUrl")
            ?: System.getenv("KIBERKMET_API_BASE_URL")
            ?: "http://localhost:5001/api"

    const val demoEmail = "vaja2@kiberkmet.local"
    const val demoPassword = "vaja2geslo"
}

private object ApiClient {
    val client = HttpClient(CIO) {
        install(ContentNegotiation) {
            json(Json { ignoreUnknownKeys = true })
        }
    }

    var accessToken: String? = null

    fun setSession(response: LoginResponse) {
        accessToken = response.accessToken
    }

    fun logout() {
        accessToken = null
    }

    suspend fun ensureAuthenticated() {
        if (accessToken != null) return

        try {
            UserApi.addUser(
                UserRequest(
                    name = "KiberKmet",
                    email = ApiConfig.demoEmail,
                    password = ApiConfig.demoPassword
                )
            )
        } catch (_: Exception) {
            // Uporabnik je lahko ze registriran, zato nadaljujemo s prijavo.
        }

        val response = UserApi.login(
            LoginRequest(
                email = ApiConfig.demoEmail,
                password = ApiConfig.demoPassword
            )
        )
        accessToken = response.accessToken
    }
}

private fun HttpRequestBuilder.authorized() {
    ApiClient.accessToken?.let { token ->
        header(HttpHeaders.Authorization, "Bearer $token")
    }
}

private suspend fun HttpResponse.requireSuccess(): HttpResponse {
    if (status.value >= 400) {
        throw Exception(bodyAsText().ifBlank { "Napaka API-ja: ${status.value}" })
    }

    return this
}

private fun landUseForApi(option: RabaOption): String {
    return landUseForApi(option.id, option.name)
}

private fun landUseForApi(rabaId: Int, fallback: String = "Ostalo"): String {
    return when (rabaId) {
        1100 -> "Njiva"
        1211 -> "Vinograd"
        1221, 1222 -> "Sadovnjak"
        1300, 1321 -> "Travnik"
        2000 -> "Gozd"
        else -> fallback
    }
}

private val AppBackground = Color(0xFFF4F7F3)
private val SidebarBackground = Color(0xFFFFFFFF)
private val PrimaryGreen = Color(0xFF1F6F43)
private val SoftGreen = Color(0xFFEAF4EC)
private val TextDark = Color(0xFF1F2A24)
private val TextMuted = Color(0xFF66736B)

private fun normalizeHexColor(value: String): String? {
    val trimmed = value.trim()
    val hex = if (trimmed.startsWith("#")) trimmed.drop(1) else trimmed
    if (!Regex("^[0-9A-Fa-f]{6}$").matches(hex)) return null
    return "#${hex.uppercase()}"
}

private fun colorFromHex(value: String): Color {
    val normalized = normalizeHexColor(value) ?: "#3B7A57"
    return Color(
        red = normalized.substring(1, 3).toInt(16),
        green = normalized.substring(3, 5).toInt(16),
        blue = normalized.substring(5, 7).toInt(16)
    )
}

private fun awtColorFromHex(value: String): java.awt.Color {
    val normalized = normalizeHexColor(value) ?: "#3B7A57"
    return java.awt.Color(
        normalized.substring(1, 3).toInt(16),
        normalized.substring(3, 5).toInt(16),
        normalized.substring(5, 7).toInt(16)
    )
}

private fun java.awt.Color.toHexColor(): String {
    return "#%02X%02X%02X".format(red, green, blue)
}

private fun formatKg(value: Double?): String {
    if (value == null) return "-"
    if (value >= 1000) return "%.2f t".format(value / 1000)
    return if (value % 1.0 == 0.0) "${value.toInt()} kg" else "%.1f kg".format(value)
}

private fun expectedHarvestKg(plan: CropPlan, areaHectares: Double?): Double? {
    if (areaHectares == null || areaHectares <= 0.0) return null
    val crop = cropYieldInfo[plan.cropName] ?: return null
    val tonsPerHa = crop.tonsPerHa ?: return null
    val plantedAreaHa = areaHectares * (plan.areaPercent / 100.0)
    val baselineKg = plantedAreaHa * tonsPerHa * 1000.0
    val seedRate = crop.seedRateKgPerHa
    val plantedKg = plan.plantedAmountKg

    if (seedRate == null || plantedKg == null || plantedKg <= 0.0 || plantedAreaHa <= 0.0) {
        return baselineKg
    }

    val optimalMinKg = plantedAreaHa * seedRate.start
    val optimalMaxKg = plantedAreaHa * seedRate.endInclusive
    val seedFactor = when {
        plantedKg < optimalMinKg -> maxOf(0.35, plantedKg / optimalMinKg)
        plantedKg > optimalMaxKg -> {
            val overRatio = (plantedKg - optimalMaxKg) / optimalMaxKg
            maxOf(0.75, 1.0 - overRatio * 0.35)
        }
        else -> 1.0
    }

    return baselineKg * seedFactor
}

object ParcelApi {

    private val baseUrl = "${ApiConfig.baseUrl}/parcele"

    suspend fun getAllParcels(): List<Parcel> {
        ApiClient.ensureAuthenticated()
        return ApiClient.client.get(baseUrl) {
            authorized()
        }.requireSuccess().body()
    }

    suspend fun addParcel(request: ParcelRequest): Parcel {
        ApiClient.ensureAuthenticated()
        return ApiClient.client.post(baseUrl) {
            authorized()
            contentType(ContentType.Application.Json)
            setBody(request)
        }.requireSuccess().body()
    }

    suspend fun updateParcel(id: String, request: ParcelRequest): Parcel {
        ApiClient.ensureAuthenticated()
        return ApiClient.client.put("$baseUrl/$id") {
            authorized()
            contentType(ContentType.Application.Json)
            setBody(request)
        }.requireSuccess().body()
    }

    suspend fun deleteParcel(id: String) {
        ApiClient.ensureAuthenticated()
        ApiClient.client.delete("$baseUrl/$id") {
            authorized()
        }.requireSuccess()
    }

    suspend fun listCropPlans(parcelId: String): List<CropPlan> {
        ApiClient.ensureAuthenticated()
        return ApiClient.client.get("$baseUrl/$parcelId/crop-plans") {
            authorized()
        }.requireSuccess().body()
    }

    suspend fun createCropPlan(parcelId: String, request: CropPlanRequest): CropPlan {
        ApiClient.ensureAuthenticated()
        return ApiClient.client.post("$baseUrl/$parcelId/crop-plans") {
            authorized()
            contentType(ContentType.Application.Json)
            setBody(request)
        }.requireSuccess().body()
    }

    suspend fun updateCropPlan(parcelId: String, planId: String, request: CropPlanRequest): CropPlan {
        ApiClient.ensureAuthenticated()
        return ApiClient.client.put("$baseUrl/$parcelId/crop-plans/$planId") {
            authorized()
            contentType(ContentType.Application.Json)
            setBody(request)
        }.requireSuccess().body()
    }

    suspend fun deleteCropPlan(parcelId: String, planId: String) {
        ApiClient.ensureAuthenticated()
        ApiClient.client.delete("$baseUrl/$parcelId/crop-plans/$planId") {
            authorized()
        }.requireSuccess()
    }
}

@Serializable
data class User(
    val id: String,
    val name: String,
    val email: String,
    val password: String? = null,
    val createdAt: String? = null
)

@Serializable
data class UserRequest(
    val name: String,
    val email: String,
    val password: String
)

@Serializable
data class UserUpdateRequest(
    val name: String? = null,
    val email: String? = null,
    val password: String? = null
)

@Serializable
data class LoginRequest(
    val email: String,
    val password: String
)

@Serializable
data class LoginResponse(
    val accessToken: String,
    val refreshToken: String,
    val user: User
)

object UserApi {

    private val baseUrl = "${ApiConfig.baseUrl}/users"

    suspend fun getAllUsers(): List<User> {
        ApiClient.ensureAuthenticated()
        return ApiClient.client.get(baseUrl) {
            authorized()
        }.requireSuccess().body()
    }

    suspend fun addUser(request: UserRequest): User {
        val response = ApiClient.client.post("$baseUrl/register") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.requireSuccess()

        return response.body()
    }

    suspend fun login(request: LoginRequest): LoginResponse {
        val response = ApiClient.client.post("$baseUrl/login") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.requireSuccess()

        return response.body()
    }

    suspend fun updateUser(id: String, request: UserUpdateRequest): User {
        ApiClient.ensureAuthenticated()
        val response = ApiClient.client.put("$baseUrl/$id") {
            authorized()
            contentType(ContentType.Application.Json)
            setBody(request)
        }.requireSuccess()

        return response.body()
    }

    suspend fun deleteUser(id: String) {
        ApiClient.ensureAuthenticated()
        ApiClient.client.delete("$baseUrl/$id") {
            authorized()
        }.requireSuccess()
    }
}

@Composable
fun App() {

    var selectedScreen by remember {
        mutableStateOf("about")
    }

    var loggedInUser by remember {
        mutableStateOf<User?>(null)
    }

    MaterialTheme {

        if (loggedInUser == null) {
            LoginScreen(
                onLoginSuccess = { user ->
                    loggedInUser = user
                    selectedScreen = "about"
                }
            )
        } else {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .background(AppBackground)
            ) {

                LeftMenu(
                    selectedScreen = selectedScreen,
                    onAddParcelClick = {
                        selectedScreen = "addParcel"
                    },
                    onParcelsClick = {
                        selectedScreen = "parcels"
                    },
                    onAddUserClick = {
                        selectedScreen = "addUser"
                    },
                    onUsersClick = {
                        selectedScreen = "users"
                    },
                    onScraperClick = {
                        selectedScreen = "scraper"
                    },
                    onGeneratorClick = {
                        selectedScreen = "generator"
                    },
                    onAboutClick = {
                        selectedScreen = "about"
                    },
                    onLogoutClick = {
                        ApiClient.logout()
                        loggedInUser = null
                        selectedScreen = "about"
                    }
                )

                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(AppBackground)
                ) {

                    when (selectedScreen) {

                        "addParcel" -> AddParcelScreen(
                            onParcelSaved = {
                                selectedScreen = "parcels"
                            }
                        )

                        "parcels" -> ParcelsScreen()

                        "addUser" -> AddUserScreen(
                            onUserSaved = {
                                selectedScreen = "users"
                            }
                        )

                        "users" -> UsersScreen()

                        "scraper" -> ScraperSelectionScreen(
                            onMeteoClick = { selectedScreen = "scraperMeteo" },
                            onScraper2Click = { selectedScreen = "scraper2" }
                        )

                        "scraperMeteo" -> MeteoScraperScreen()

                        "scraper2" -> GerkScraperScreen()

                        "generator" -> GeneratorSelectionScreen(
                            onOptionClick = { selectedScreen = it }
                        )

                        "generatorUser"    -> GeneratorUserScreen(onBack = { selectedScreen = "generator" })
                        "generatorParcela" -> GeneratorParcelaScreen(onBack = { selectedScreen = "generator" })

                        else -> AboutScreen()
                    }
                }
            }
        }
    }
}

@Composable
fun LeftMenu(
    selectedScreen: String,
    onAddParcelClick: () -> Unit,
    onParcelsClick: () -> Unit,
    onAddUserClick: () -> Unit,
    onUsersClick: () -> Unit,
    onScraperClick: () -> Unit,
    onGeneratorClick: () -> Unit,
    onAboutClick: () -> Unit,
    onLogoutClick: () -> Unit
) {

    Column(
        modifier = Modifier
            .width(280.dp)
            .fillMaxHeight()
            .background(SidebarBackground)
            .padding(top = 20.dp, bottom = 18.dp)
    ) {

        Column(modifier = Modifier.padding(horizontal = 24.dp)) {
            Text("KiberKmet", fontSize = 28.sp, color = PrimaryGreen)
        }

        Spacer(modifier = Modifier.height(18.dp))

        MenuItem(Icons.Default.Add, "Dodaj parcelo", selectedScreen == "addParcel", onClick = onAddParcelClick)
        MenuItem(Icons.Default.List, "Parcele", selectedScreen == "parcels", onClick = onParcelsClick)

        DividerLine()

        MenuItem(Icons.Default.Add, "Dodaj uporabnika", selectedScreen == "addUser", onClick = onAddUserClick)
        MenuItem(Icons.Default.List, "Uporabniki", selectedScreen == "users", onClick = onUsersClick)

        DividerLine()

        MenuItem(Icons.Default.Share, "Zajem podatkov", selectedScreen.startsWith("scraper"), onClick = onScraperClick)
        MenuItem(Icons.Default.Build, "Generator", selectedScreen.startsWith("generator"), onClick = onGeneratorClick)

        DividerLine()

        MenuItem(Icons.Default.Info, "O aplikaciji", selectedScreen == "about", onClick = onAboutClick)

        Spacer(modifier = Modifier.weight(1f))

        DividerLine()
        MenuItem(Icons.Default.ExitToApp, "Odjava", false, onClick = onLogoutClick)
    }
}

@Composable
fun MenuItem(
    icon: ImageVector,
    text: String,
    selected: Boolean = false,
    onClick: () -> Unit = {}
) {

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(58.dp)
            .padding(horizontal = 14.dp, vertical = 4.dp)
            .background(if (selected) SoftGreen else SidebarBackground)
            .clickable { onClick() }
            .padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {

        Icon(
            imageVector = icon,
            contentDescription = text,
            tint = if (selected) PrimaryGreen else TextMuted,
            modifier = Modifier.size(24.dp)
        )

        Spacer(modifier = Modifier.width(20.dp))

        Text(
            text = text,
            fontSize = 16.sp,
            color = if (selected) PrimaryGreen else TextDark
        )
    }
}

@Composable
fun DividerLine() {

    Divider(
        modifier = Modifier.padding(start = 24.dp, end = 24.dp, top = 10.dp, bottom = 10.dp),
        color = Color(0xFFE3E8E3),
        thickness = 1.dp
    )
}

@Composable
fun LoginScreen(onLoginSuccess: (User) -> Unit) {
    var email by remember { mutableStateOf(ApiConfig.demoEmail) }
    var password by remember { mutableStateOf(ApiConfig.demoPassword) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(AppBackground),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .widthIn(min = 360.dp, max = 460.dp)
                .background(Color.White)
                .padding(32.dp)
        ) {
            Text("KiberKmet", fontSize = 34.sp, color = PrimaryGreen)
            Spacer(modifier = Modifier.height(8.dp))
            Text("Prijava v namizno aplikacijo", fontSize = 16.sp, color = TextMuted)

            Spacer(modifier = Modifier.height(28.dp))

            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("E-pošta") },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(14.dp))

            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Geslo") },
                visualTransformation = PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(22.dp))

            Button(
                enabled = !loading,
                onClick = {
                    loading = true
                    error = null

                    scope.launch {
                        try {
                            val response = withContext(Dispatchers.IO) {
                                UserApi.login(LoginRequest(email.trim(), password))
                            }
                            ApiClient.setSession(response)
                            onLoginSuccess(response.user)
                        } catch (e: Exception) {
                            error = e.message ?: "Prijava ni uspela."
                        } finally {
                            loading = false
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(if (loading) "Prijavljanje..." else "Prijava")
            }

            Spacer(modifier = Modifier.height(10.dp))

            OutlinedButton(
                enabled = !loading,
                onClick = {
                    loading = true
                    error = null
                    email = ApiConfig.demoEmail
                    password = ApiConfig.demoPassword

                    scope.launch {
                        try {
                            val response = withContext(Dispatchers.IO) {
                                ApiClient.ensureAuthenticated()
                                UserApi.login(LoginRequest(ApiConfig.demoEmail, ApiConfig.demoPassword))
                            }
                            ApiClient.setSession(response)
                            onLoginSuccess(response.user)
                        } catch (e: Exception) {
                            error = e.message ?: "Demo prijava ni uspela."
                        } finally {
                            loading = false
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Uporabi demo račun")
            }

            if (error != null) {
                Spacer(modifier = Modifier.height(16.dp))
                Text("Napaka: $error", color = Color.Red, fontSize = 14.sp)
            }
        }
    }
}

@Composable
fun AboutScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Text("KiberKmet", fontSize = 34.sp, color = TextDark)
        Spacer(modifier = Modifier.height(8.dp))
        Text("Pregled parcel, uporabnikov, podatkovnih uvozov in generatorjev.", fontSize = 16.sp, color = TextMuted)

        Spacer(modifier = Modifier.height(28.dp))

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            AboutCard("Parcele", "Dodajanje, urejanje in pregled poligonov parcel.", Modifier.weight(1f))
            AboutCard("Uporabniki", "Registracija, urejanje in pregled uporabnikov.", Modifier.weight(1f))
            AboutCard("Scraper", "Vremenski podatki in uvoz GERK parcel.", Modifier.weight(1f))
        }

        Spacer(modifier = Modifier.height(16.dp))

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            AboutCard("Generator", "Hitro ustvarjanje testnih uporabnikov in parcel.", Modifier.weight(1f))
            AboutCard("API", "Povezava na ${ApiConfig.baseUrl}.", Modifier.weight(1f))
        }
    }
}

@Composable
fun AboutCard(title: String, body: String, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .background(Color.White)
            .padding(20.dp)
    ) {
        Text(title, fontSize = 20.sp, color = PrimaryGreen)
        Spacer(modifier = Modifier.height(8.dp))
        Text(body, fontSize = 14.sp, color = TextMuted)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddParcelScreen(
    parcelToEdit: Parcel? = null,
    onParcelSaved: () -> Unit
) {

    var parcelName by remember {
        mutableStateOf(parcelToEdit?.name ?: parcelToEdit?.gerk_pid ?: "")
    }

    var parcelColor by remember {
        mutableStateOf(parcelToEdit?.color ?: "#3B7A57")
    }

    var selectedRaba by remember {
        mutableStateOf(
            rabaOptions.firstOrNull {
                it.id.toString() == parcelToEdit?.typeOfUse || it.name == parcelToEdit?.typeOfUse
            } ?: rabaOptions.first()
        )
    }

    var dropdownExpanded by remember {
        mutableStateOf(false)
    }

    var points by remember {

        mutableStateOf(
            parcelToEdit?.coordinates?.coordinates?.firstOrNull()
                ?.dropLast(1)
                ?.map {
                    CoordinatePoint(
                        longitude = it[0].toString(),
                        latitude = it[1].toString()
                    )
                }
                ?: listOf(
                    CoordinatePoint("14.0", "45.0"),
                    CoordinatePoint("14.1", "45.0"),
                    CoordinatePoint("14.1", "45.1"),
                    CoordinatePoint("14.0", "45.1")
                )
        )
    }

    var loading by remember {
        mutableStateOf(false)
    }

    var error by remember {
        mutableStateOf<String?>(null)
    }

    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
            .verticalScroll(rememberScrollState())
    ) {

        Text(
            text = if (parcelToEdit == null) "Dodaj parcelo" else "Uredi parcelo",
            fontSize = 30.sp
        )

        Spacer(modifier = Modifier.height(24.dp))

        OutlinedTextField(
            value = parcelName,
            onValueChange = {
                parcelName = it
            },
            label = {
                Text("Ime")
            },
            modifier = Modifier.fillMaxWidth(0.6f)
        )

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(0.6f),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = parcelColor,
                onValueChange = {
                    parcelColor = it
                },
                label = {
                    Text("Barva")
                },
                modifier = Modifier.weight(1f)
            )

            Spacer(modifier = Modifier.width(12.dp))

            Box(
                modifier = Modifier
                    .size(48.dp)
                    .background(colorFromHex(parcelColor))
            )

            Spacer(modifier = Modifier.width(12.dp))

            Button(
                onClick = {
                    val picked = JColorChooser.showDialog(
                        null,
                        "Izberi barvo parcele",
                        awtColorFromHex(parcelColor)
                    )
                    if (picked != null) {
                        parcelColor = picked.toHexColor()
                    }
                }
            ) {
                Text("Izberi")
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        ExposedDropdownMenuBox(
            expanded = dropdownExpanded,
            onExpandedChange = {
                dropdownExpanded = !dropdownExpanded
            }
        ) {

            OutlinedTextField(
                value = "${selectedRaba.id} - ${selectedRaba.name}",
                onValueChange = {},
                readOnly = true,
                label = {
                    Text("Tip rabe")
                },
                trailingIcon = {
                    ExposedDropdownMenuDefaults.TrailingIcon(
                        expanded = dropdownExpanded
                    )
                },
                modifier = Modifier
                    .menuAnchor()
                    .fillMaxWidth(0.6f)
            )

            ExposedDropdownMenu(
                expanded = dropdownExpanded,
                onDismissRequest = {
                    dropdownExpanded = false
                }
            ) {

                rabaOptions.forEach { option ->

                    DropdownMenuItem(
                        text = {
                            Text("${option.id} - ${option.name}")
                        },
                        onClick = {
                            selectedRaba = option
                            dropdownExpanded = false
                        }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text("Koordinate poligona", fontSize = 24.sp)

        Spacer(modifier = Modifier.height(12.dp))

        points.forEachIndexed { index, point ->

            Row(
                modifier = Modifier.padding(bottom = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {

                OutlinedTextField(
                    value = point.longitude,
                    onValueChange = { newValue ->

                        points = points.toMutableList().also {
                            it[index] = it[index].copy(longitude = newValue)
                        }
                    },
                    label = {
                        Text("Dolžina")
                    },
                    modifier = Modifier.width(180.dp)
                )

                Spacer(modifier = Modifier.width(12.dp))

                OutlinedTextField(
                    value = point.latitude,
                    onValueChange = { newValue ->

                        points = points.toMutableList().also {
                            it[index] = it[index].copy(latitude = newValue)
                        }
                    },
                    label = {
                        Text("Širina")
                    },
                    modifier = Modifier.width(180.dp)
                )

                Spacer(modifier = Modifier.width(12.dp))

                Button(
                    enabled = points.size > 3,
                    onClick = {

                        points = points.toMutableList().also {
                            it.removeAt(index)
                        }
                    }
                ) {
                    Text("Odstrani")
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Button(
            onClick = {
                points = points + CoordinatePoint()
            }
        ) {
            Text("Dodaj točko")
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            enabled = !loading,
            onClick = {

                loading = true
                error = null

                scope.launch {

                    try {

                        if (parcelName.isBlank()) {
                            throw IllegalArgumentException("Ime je obvezno.")
                        }

                        val normalizedColor = normalizeHexColor(parcelColor)
                            ?: throw IllegalArgumentException("Barva mora biti v obliki #RRGGBB.")

                        val polygonPoints = points.map { point ->

                            val longitude = point.longitude.toDoubleOrNull()
                                ?: throw IllegalArgumentException("Neveljavna dolžina.")

                            val latitude = point.latitude.toDoubleOrNull()
                                ?: throw IllegalArgumentException("Neveljavna širina.")

                            listOf(longitude, latitude)

                        }.toMutableList()

                        val firstPoint = polygonPoints.first()
                        val lastPoint = polygonPoints.last()

                        if (firstPoint != lastPoint) {
                            polygonPoints.add(firstPoint)
                        }

                        val request = ParcelRequest(
                            name = parcelName,
                            color = normalizedColor,
                            gerk_pid = parcelToEdit?.gerk_pid,
                            typeOfUse = landUseForApi(selectedRaba),
                            coordinates = Coordinates(
                                type = "Polygon",
                                coordinates = listOf(polygonPoints)
                            )
                        )

                        if (parcelToEdit == null) {
                            ParcelApi.addParcel(request)
                        } else {
                            ParcelApi.updateParcel(parcelToEdit.id, request)
                        }

                        onParcelSaved()

                    } catch (e: Exception) {

                        error = e.message ?: "Napaka pri shranjevanju parcele."

                    } finally {
                        loading = false
                    }
                }
            }
        ) {

            Text(
                if (loading)
                    "Shranjujem..."
                else if (parcelToEdit == null)
                    "Dodaj parcelo"
                else
                    "Uredi parcelo"
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        if (error != null) {

            Text(
                text = "Napaka: $error",
                color = Color.Red
            )
        }
    }
}

@Composable
fun ParcelsScreen() {

    var parcels by remember {
        mutableStateOf<List<Parcel>>(emptyList())
    }

    var loading by remember {
        mutableStateOf(true)
    }

    var error by remember {
        mutableStateOf<String?>(null)
    }

    var selectedParcel by remember {
        mutableStateOf<Parcel?>(null)
    }

    var editingParcel by remember {
        mutableStateOf<Parcel?>(null)
    }

    val scope = rememberCoroutineScope()

    fun loadParcels() {

        scope.launch {

            loading = true
            error = null

            try {
                parcels = ParcelApi.getAllParcels()
            } catch (e: Exception) {
                error = e.message
            } finally {
                loading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        loadParcels()
    }

    if (editingParcel != null) {

        AddParcelScreen(
            parcelToEdit = editingParcel,
            onParcelSaved = {

                editingParcel = null
                selectedParcel = null
                loadParcels()
            }
        )

        return
    }

    BoxWithConstraints(
        modifier = Modifier.fillMaxSize()
    ) {

        val isSmallScreen = maxWidth < 900.dp

        if (isSmallScreen) {

            Column(
                modifier = Modifier.fillMaxSize()
            ) {

                ParcelsList(
                    parcels = parcels,
                    loading = loading,
                    error = error,
                    selectedParcel = selectedParcel,
                    onParcelClick = {
                        selectedParcel = it
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                )

                ParcelDetails(
                    parcel = selectedParcel,
                    onUpdateClick = {
                        editingParcel = it
                    },
                    onDeleteClick = { parcel ->

                        scope.launch {

                            try {

                                ParcelApi.deleteParcel(parcel.id)

                                selectedParcel = null
                                loadParcels()

                            } catch (e: Exception) {
                                error = e.message
                            }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 260.dp, max = 420.dp)
                )
            }

        } else {

            Row(
                modifier = Modifier.fillMaxSize()
            ) {

                ParcelsList(
                    parcels = parcels,
                    loading = loading,
                    error = error,
                    selectedParcel = selectedParcel,
                    onParcelClick = {
                        selectedParcel = it
                    },
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight()
                )

                ParcelDetails(
                    parcel = selectedParcel,
                    onUpdateClick = {
                        editingParcel = it
                    },
                    onDeleteClick = { parcel ->

                        scope.launch {

                            try {

                                ParcelApi.deleteParcel(parcel.id)

                                selectedParcel = null
                                loadParcels()

                            } catch (e: Exception) {
                                error = e.message
                            }
                        }
                    },
                    modifier = Modifier
                        .widthIn(min = 320.dp, max = 460.dp)
                        .fillMaxHeight()
                )
            }
        }
    }
}

@Composable
fun ParcelsList(
    parcels: List<Parcel>,
    loading: Boolean,
    error: String?,
    selectedParcel: Parcel?,
    onParcelClick: (Parcel) -> Unit,
    modifier: Modifier = Modifier
) {

    Column(
        modifier = modifier
            .padding(24.dp)
            .verticalScroll(rememberScrollState())
    ) {

        Text(
            "Parcele",
            fontSize = 30.sp
        )

        Spacer(modifier = Modifier.height(20.dp))

        when {

            loading -> Text("Nalagam...")

            error != null -> Text(
                text = "Napaka: $error",
                color = Color.Red
            )

            parcels.isEmpty() -> Text("Ni najdenih parcel.")

            else -> {

                parcels.forEach { parcel ->

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp)
                            .background(
                                if (selectedParcel?.id == parcel.id)
                                    Color(0xFFDCEEFF)
                                else
                                    Color.White
                            )
                            .clickable {
                                onParcelClick(parcel)
                            }
                            .padding(16.dp)
                    ) {

                        Column {

                            Text(
                                text = parcel.name ?: parcel.gerk_pid ?: "Parcela",
                                fontSize = 20.sp
                            )

                            Spacer(modifier = Modifier.height(4.dp))

                            Text(
                                text = "Tip: ${parcel.typeOfUse.toIntOrNull()?.let { mapRaba(it) } ?: parcel.typeOfUse}",
                                fontSize = 16.sp
                            )

                            if (parcel.cropPlans.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Pridelki: ${parcel.cropPlans.joinToString { "${it.cropName} ${it.areaPercent.toInt()}%" }}",
                                    fontSize = 14.sp,
                                    color = TextMuted
                                )
                            } else if (!parcel.plannedCropName.isNullOrBlank() || parcel.plannedCropPercent != null) {
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Pridelek: ${parcel.plannedCropName ?: "-"} ${parcel.plannedCropPercent ?: ""}%",
                                    fontSize = 14.sp,
                                    color = TextMuted
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun ParcelDetails(
    parcel: Parcel?,
    onUpdateClick: (Parcel) -> Unit,
    onDeleteClick: (Parcel) -> Unit,
    modifier: Modifier = Modifier
) {
    val scope = rememberCoroutineScope()

    Box(
        modifier = modifier
            .background(Color.White)
            .padding(24.dp)
    ) {

        if (parcel == null) {

            Text(
                "Izberi parcelo",
                fontSize = 24.sp
            )

        } else {
            var cropPlans by remember(parcel.id) {
                mutableStateOf(parcel.cropPlans)
            }
            var cropName by remember(parcel.id) {
                mutableStateOf("")
            }
            var cropDropdownExpanded by remember(parcel.id) {
                mutableStateOf(false)
            }
            var cropPercent by remember(parcel.id) {
                val used = parcel.cropPlans.sumOf { it.areaPercent }
                mutableStateOf(((100.0 - used).coerceIn(0.0, 100.0).toInt()).toString())
            }
            var plantedAmountKg by remember(parcel.id) {
                mutableStateOf("")
            }
            var cropError by remember(parcel.id) {
                mutableStateOf<String?>(null)
            }
            var savingCrop by remember(parcel.id) {
                mutableStateOf(false)
            }

            LaunchedEffect(parcel.id) {
                cropError = null
                try {
                    cropPlans = ParcelApi.listCropPlans(parcel.id)
                } catch (e: Exception) {
                    cropError = e.message
                }
            }

            val totalPlannedPercent = cropPlans.sumOf { it.areaPercent }
            val remainingPercent = (100.0 - totalPlannedPercent).coerceAtLeast(0.0)
            val isFullyPlanted = remainingPercent <= 0.0

            fun resetNextCropPercent(nextPlans: List<CropPlan>) {
                val nextRemaining = (100.0 - nextPlans.sumOf { it.areaPercent }).coerceAtLeast(0.0)
                cropPercent = nextRemaining.toInt().toString()
            }

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
            ) {

                Text(
                    "Podrobne informacije",
                    fontSize = 30.sp
                )

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    "Ime:",
                    fontSize = 18.sp
                )

                Text(
                    parcel.name ?: parcel.gerk_pid ?: "Parcela",
                    fontSize = 16.sp
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    "Tip rabe:",
                    fontSize = 18.sp
                )

                Text(
                    "${parcel.typeOfUse} - ${parcel.typeOfUse.toIntOrNull()?.let { mapRaba(it) } ?: parcel.typeOfUse}",
                    fontSize = 16.sp
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    "Barva:",
                    fontSize = 18.sp
                )

                Text(
                    parcel.color ?: "-",
                    fontSize = 16.sp
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    "Načrt pridelkov:",
                    fontSize = 22.sp
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    "${totalPlannedPercent.coerceAtMost(100.0).toInt()}% zasedeno - ${remainingPercent.toInt()}% prosto",
                    fontSize = 14.sp,
                    color = TextMuted
                )

                if (isFullyPlanted) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        "Parcela je 100% zasedena. Za nov pridelek najprej odstrani ali zmanjša obstoječo rabo.",
                        fontSize = 13.sp,
                        color = Color(0xFFB45309)
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                ExposedDropdownMenuBox(
                    expanded = cropDropdownExpanded,
                    onExpandedChange = {
                        if (!isFullyPlanted) cropDropdownExpanded = !cropDropdownExpanded
                    }
                ) {
                    OutlinedTextField(
                        value = cropName,
                        onValueChange = {},
                        readOnly = true,
                        enabled = !isFullyPlanted,
                        label = { Text("Pridelek") },
                        trailingIcon = {
                            ExposedDropdownMenuDefaults.TrailingIcon(expanded = cropDropdownExpanded)
                        },
                        modifier = Modifier
                            .menuAnchor()
                            .fillMaxWidth()
                    )

                    ExposedDropdownMenu(
                        expanded = cropDropdownExpanded,
                        onDismissRequest = { cropDropdownExpanded = false }
                    ) {
                        cropOptions.forEach { option ->
                            DropdownMenuItem(
                                text = { Text(option) },
                                onClick = {
                                    cropName = option
                                    cropError = null
                                    cropDropdownExpanded = false
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                FlowRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = cropPercent,
                        onValueChange = {
                            cropPercent = it
                            cropError = null
                        },
                        enabled = !isFullyPlanted,
                        label = { Text("Delež (%)") },
                        modifier = Modifier.widthIn(min = 150.dp, max = 220.dp)
                    )

                    OutlinedTextField(
                        value = plantedAmountKg,
                        onValueChange = {
                            plantedAmountKg = it
                            cropError = null
                        },
                        enabled = !isFullyPlanted,
                        label = { Text("Posajeno (kg)") },
                        modifier = Modifier.widthIn(min = 150.dp, max = 220.dp)
                    )

                    Button(
                        enabled = !savingCrop && !isFullyPlanted,
                        modifier = Modifier.heightIn(min = 56.dp),
                        onClick = {
                            val trimmedName = cropName.trim()
                            val percent = cropPercent.toDoubleOrNull()
                            val plantedKg = plantedAmountKg.ifBlank { null }?.toDoubleOrNull()

                            if (trimmedName.isBlank() || percent == null) {
                                cropError = "Pridelek in delež površine sta obvezna."
                                return@Button
                            }

                            if (plantedAmountKg.isNotBlank() && plantedKg == null) {
                                cropError = "Količina posajenega mora biti številka."
                                return@Button
                            }

                            if (plantedKg != null && plantedKg < 0.0) {
                                cropError = "Količina posajenega ne sme biti negativna."
                                return@Button
                            }

                            if (trimmedName !in cropOptions) {
                                cropError = "Pridelek mora biti izbran iz seznama."
                                return@Button
                            }

                            if (percent <= 0.0) {
                                cropError = "Delež mora biti večji od 0%."
                                return@Button
                            }

                            if (percent > remainingPercent) {
                                cropError = "${remainingPercent.toInt()}% je še prosto."
                                return@Button
                            }

                            savingCrop = true
                            cropError = null

                            scope.launch {
                                try {
                                    val saved = ParcelApi.createCropPlan(
                                        parcel.id,
                                        CropPlanRequest(
                                            cropName = trimmedName,
                                            areaPercent = percent,
                                            plantedAmountKg = plantedKg
                                        )
                                    )
                                    val nextPlans = if (cropPlans.any { it.id == saved.id }) {
                                        cropPlans.map { if (it.id == saved.id) saved else it }
                                    } else {
                                        listOf(saved) + cropPlans
                                    }
                                    cropPlans = nextPlans
                                    cropName = ""
                                    plantedAmountKg = ""
                                    resetNextCropPercent(nextPlans)
                                } catch (e: Exception) {
                                    cropError = e.message ?: "Napaka pri shranjevanju pridelka."
                                } finally {
                                    savingCrop = false
                                }
                            }
                        }
                    ) {
                        Text(if (savingCrop) "Shranjujem..." else "Dodaj")
                    }
                }

                if (cropError != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Napaka: $cropError", color = Color.Red, fontSize = 13.sp)
                }

                Spacer(modifier = Modifier.height(12.dp))

                if (cropPlans.isEmpty()) {
                    Text("Za to parcelo še ni načrtovanih pridelkov.", fontSize = 14.sp, color = TextMuted)
                } else {
                    cropPlans.forEach { plan ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(plan.cropName, fontSize = 16.sp)
                                Text(
                                    "${plan.areaPercent.toInt()}% površine · posajeno ${formatKg(plan.plantedAmountKg)}",
                                    fontSize = 13.sp,
                                    color = TextMuted
                                )
                                Text(
                                    "ocena pridelka ${formatKg(expectedHarvestKg(plan, parcel.areaHectares))}",
                                    fontSize = 13.sp,
                                    color = TextMuted
                                )
                            }

                            Button(
                                enabled = plan.areaPercent > 1,
                                onClick = {
                                    val previous = cropPlans
                                    val nextPercent = (plan.areaPercent - 1).coerceAtLeast(1.0)
                                    cropPlans = cropPlans.map {
                                        if (it.id == plan.id) it.copy(areaPercent = nextPercent) else it
                                    }
                                    cropError = null

                                    scope.launch {
                                        try {
                                            val updated = ParcelApi.updateCropPlan(parcel.id, plan.id, CropPlanRequest(areaPercent = nextPercent))
                                            cropPlans = cropPlans.map { if (it.id == plan.id) updated else it }
                                            resetNextCropPercent(cropPlans)
                                        } catch (e: Exception) {
                                            cropPlans = previous
                                            cropError = e.message ?: "Napaka pri posodabljanju pridelka."
                                        }
                                    }
                                }
                            ) {
                                Text("-")
                            }

                            Spacer(modifier = Modifier.width(4.dp))

                            Button(
                                enabled = remainingPercent > 0.0,
                                onClick = {
                                    val previous = cropPlans
                                    val nextPercent = plan.areaPercent + minOf(1.0, remainingPercent)
                                    cropPlans = cropPlans.map {
                                        if (it.id == plan.id) it.copy(areaPercent = nextPercent) else it
                                    }
                                    cropError = null

                                    scope.launch {
                                        try {
                                            val updated = ParcelApi.updateCropPlan(parcel.id, plan.id, CropPlanRequest(areaPercent = nextPercent))
                                            cropPlans = cropPlans.map { if (it.id == plan.id) updated else it }
                                            resetNextCropPercent(cropPlans)
                                        } catch (e: Exception) {
                                            cropPlans = previous
                                            cropError = e.message ?: "Napaka pri posodabljanju pridelka."
                                        }
                                    }
                                }
                            ) {
                                Text("+")
                            }

                            Spacer(modifier = Modifier.width(4.dp))

                            Button(
                                onClick = {
                                    val previous = cropPlans
                                    cropPlans = cropPlans.filter { it.id != plan.id }
                                    cropError = null

                                    scope.launch {
                                        try {
                                            ParcelApi.deleteCropPlan(parcel.id, plan.id)
                                            resetNextCropPercent(cropPlans)
                                        } catch (e: Exception) {
                                            cropPlans = previous
                                            cropError = e.message ?: "Napaka pri brisanju pridelka."
                                        }
                                    }
                                }
                            ) {
                                Text("Izbriši")
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                Row {

                    Button(
                        onClick = {
                            onUpdateClick(parcel)
                        }
                    ) {
                        Text("Uredi")
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Button(
                        onClick = {
                            onDeleteClick(parcel)
                        }
                    ) {
                        Text("Izbriši")
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    "Koordinate:",
                    fontSize = 22.sp
                )

                Spacer(modifier = Modifier.height(12.dp))

                parcel.coordinates.coordinates.forEach { polygon ->

                    polygon.forEachIndexed { pointIndex, point ->

                        Text(
                            text = "${pointIndex + 1}. Longitude: ${point[0]}, Latitude: ${point[1]}",
                            fontSize = 15.sp
                        )

                        Spacer(modifier = Modifier.height(4.dp))
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
        }
    }
}

@Composable
fun AddUserScreen(
    userToEdit: User? = null,
    onUserSaved: () -> Unit
) {

    var name by remember {
        mutableStateOf(userToEdit?.name ?: "")
    }

    var email by remember {
        mutableStateOf(userToEdit?.email ?: "")
    }

    var password by remember {
        mutableStateOf("")
    }

    var loading by remember {
        mutableStateOf(false)
    }

    var error by remember {
        mutableStateOf<String?>(null)
    }

    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
            .verticalScroll(rememberScrollState())
    ) {

        Text(
            text = if (userToEdit == null) "Dodaj uporabnika" else "Uredi uporabnika",
            fontSize = 30.sp
        )

        Spacer(modifier = Modifier.height(24.dp))

        OutlinedTextField(
            value = name,
            onValueChange = {
                name = it
            },
            label = {
                Text("Ime")
            },
            modifier = Modifier.fillMaxWidth(0.6f)
        )

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = email,
            onValueChange = {
                email = it
            },
            label = {
                Text("E-pošta")
            },
            modifier = Modifier.fillMaxWidth(0.6f)
        )

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = password,
            onValueChange = {
                password = it
            },
            label = {
                Text(if (userToEdit == null) "Geslo" else "Novo geslo (pusti prazno za brez spremembe)")
            },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth(0.6f)
        )

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            enabled = !loading,
            onClick = {

                loading = true
                error = null

                scope.launch {

                    try {

                        if (name.isBlank()) {
                            throw IllegalArgumentException("Ime je obvezno.")
                        }

                        if (email.isBlank()) {
                            throw IllegalArgumentException("Email je obvezen.")
                        }

                        if (userToEdit == null) {

                            if (password.length < 8) {
                                throw IllegalArgumentException("Geslo mora imeti vsaj 8 znakov.")
                            }

                            UserApi.addUser(
                                UserRequest(
                                    name = name,
                                    email = email,
                                    password = password
                                )
                            )

                        } else {

                            UserApi.updateUser(
                                userToEdit.id,
                                UserUpdateRequest(
                                    name = name,
                                    email = email,
                                    password = password.ifBlank { null }
                                )
                            )
                        }

                        onUserSaved()

                    } catch (e: Exception) {

                        error = e.message ?: "Napaka pri shranjevanju uporabnika."

                    } finally {
                        loading = false
                    }
                }
            }
        ) {

            Text(
                if (loading)
                    "Shranjujem..."
                else if (userToEdit == null)
                    "Dodaj uporabnika"
                else
                    "Uredi uporabnika"
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        if (error != null) {

            Text(
                text = "Napaka: $error",
                color = Color.Red
            )
        }
    }
}

@Composable
fun UsersScreen() {

    var users by remember {
        mutableStateOf<List<User>>(emptyList())
    }

    var loading by remember {
        mutableStateOf(true)
    }

    var error by remember {
        mutableStateOf<String?>(null)
    }

    var selectedUser by remember {
        mutableStateOf<User?>(null)
    }

    var editingUser by remember {
        mutableStateOf<User?>(null)
    }

    val scope = rememberCoroutineScope()

    fun loadUsers() {

        scope.launch {

            loading = true
            error = null

            try {
                users = UserApi.getAllUsers()
            } catch (e: Exception) {
                error = e.message
            } finally {
                loading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        loadUsers()
    }

    if (editingUser != null) {

        AddUserScreen(
            userToEdit = editingUser,
            onUserSaved = {

                editingUser = null
                selectedUser = null
                loadUsers()
            }
        )

        return
    }

    BoxWithConstraints(
        modifier = Modifier.fillMaxSize()
    ) {

        val isSmallScreen = maxWidth < 900.dp

        if (isSmallScreen) {

            Column(
                modifier = Modifier.fillMaxSize()
            ) {

                UsersList(
                    users = users,
                    loading = loading,
                    error = error,
                    selectedUser = selectedUser,
                    onUserClick = {
                        selectedUser = it
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                )

                UserDetails(
                    user = selectedUser,
                    onUpdateClick = {
                        editingUser = it
                    },
                    onDeleteClick = { user ->

                        scope.launch {

                            try {

                                UserApi.deleteUser(user.id)

                                selectedUser = null
                                loadUsers()

                            } catch (e: Exception) {
                                error = e.message
                            }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 260.dp, max = 420.dp)
                )
            }

        } else {

            Row(
                modifier = Modifier.fillMaxSize()
            ) {

                UsersList(
                    users = users,
                    loading = loading,
                    error = error,
                    selectedUser = selectedUser,
                    onUserClick = {
                        selectedUser = it
                    },
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight()
                )

                UserDetails(
                    user = selectedUser,
                    onUpdateClick = {
                        editingUser = it
                    },
                    onDeleteClick = { user ->

                        scope.launch {

                            try {

                                UserApi.deleteUser(user.id)

                                selectedUser = null
                                loadUsers()

                            } catch (e: Exception) {
                                error = e.message
                            }
                        }
                    },
                    modifier = Modifier
                        .widthIn(min = 320.dp, max = 460.dp)
                        .fillMaxHeight()
                )
            }
        }
    }
}

@Composable
fun UsersList(
    users: List<User>,
    loading: Boolean,
    error: String?,
    selectedUser: User?,
    onUserClick: (User) -> Unit,
    modifier: Modifier = Modifier
) {

    Column(
        modifier = modifier
            .padding(24.dp)
            .verticalScroll(rememberScrollState())
    ) {

        Text(
            "Uporabniki",
            fontSize = 30.sp
        )

        Spacer(modifier = Modifier.height(20.dp))

        when {

            loading -> Text("Nalagam...")

            error != null -> Text(
                text = "Napaka: $error",
                color = Color.Red
            )

            users.isEmpty() -> Text("Ni najdenih uporabnikov.")

            else -> {

                users.forEach { user ->

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp)
                            .background(
                                if (selectedUser?.id == user.id)
                                    Color(0xFFDCEEFF)
                                else
                                    Color.White
                            )
                            .clickable {
                                onUserClick(user)
                            }
                            .padding(16.dp)
                    ) {

                        Column {

                            Text(
                                text = user.name,
                                fontSize = 20.sp
                            )

                            Spacer(modifier = Modifier.height(4.dp))

                            Text(
                                text = user.email,
                                fontSize = 16.sp
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun UserDetails(
    user: User?,
    onUpdateClick: (User) -> Unit,
    onDeleteClick: (User) -> Unit,
    modifier: Modifier = Modifier
) {

    Box(
        modifier = modifier
            .background(Color.White)
            .padding(24.dp)
    ) {

        if (user == null) {

            Text(
                "Izberi uporabnika",
                fontSize = 24.sp
            )

        } else {

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
            ) {

                Text(
                    "Podrobnosti uporabnika",
                    fontSize = 30.sp
                )

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    "Ime:",
                    fontSize = 18.sp
                )

                Text(
                    user.name,
                    fontSize = 16.sp
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    "Email:",
                    fontSize = 18.sp
                )

                Text(
                    user.email,
                    fontSize = 16.sp
                )

                Spacer(modifier = Modifier.height(16.dp))

                if (user.createdAt != null) {

                    Text(
                        "Ustvarjeno:",
                        fontSize = 18.sp
                    )

                    Text(
                        user.createdAt,
                        fontSize = 16.sp
                    )

                    Spacer(modifier = Modifier.height(16.dp))
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row {

                    Button(
                        onClick = {
                            onUpdateClick(user)
                        }
                    ) {
                        Text("Uredi")
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Button(
                        onClick = {
                            onDeleteClick(user)
                        }
                    ) {
                        Text("Izbriši")
                    }
                }
            }
        }
    }
}

@Composable
fun ScraperSelectionScreen(
    onMeteoClick: () -> Unit,
    onScraper2Click: () -> Unit
) {

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
    ) {

        Text(
            "Zajem podatkov",
            fontSize = 30.sp
        )

        Spacer(modifier = Modifier.height(20.dp))

        Text(
            "Izberi vir podatkov:",
            fontSize = 18.sp
        )

        Spacer(modifier = Modifier.height(16.dp))

        Box(
            modifier = Modifier
                .fillMaxWidth(0.5f)
                .background(Color.White)
                .clickable { onMeteoClick() }
                .padding(20.dp)
        ) {

            Column {

                Text(
                    "Open-Meteo",
                    fontSize = 22.sp
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    "Vremenska napoved (najnižja/najvišja temperatura)",
                    fontSize = 15.sp,
                    color = Color.Gray
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Box(
            modifier = Modifier
                .fillMaxWidth(0.5f)
                .background(Color.White)
                .clickable { onScraper2Click() }
                .padding(20.dp)
        ) {

            Column {

                Text(
                    "GERK Parcele",
                    fontSize = 22.sp
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    "Razčlenjevanje parcel iz uradnega GERK vira",
                    fontSize = 15.sp,
                    color = Color.Gray
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MeteoScraperScreen() {

    var latitude by remember {
        mutableStateOf("46.05")
    }

    var longitude by remember {
        mutableStateOf("14.51")
    }

    var allData by remember {
        mutableStateOf<List<WeatherData>>(emptyList())
    }

    var filteredData by remember {
        mutableStateOf<List<WeatherData>>(emptyList())
    }

    var loading by remember {
        mutableStateOf(false)
    }

    var error by remember {
        mutableStateOf<String?>(null)
    }

    var filterDateFrom by remember {
        mutableStateOf("")
    }

    var filterDateTo by remember {
        mutableStateOf("")
    }

    var filterMinTemp by remember {
        mutableStateOf("")
    }

    var filterMaxTemp by remember {
        mutableStateOf("")
    }

    var sortBy by remember {
        mutableStateOf("date")
    }

    var sortAscending by remember {
        mutableStateOf(true)
    }

    var sortDropdownExpanded by remember {
        mutableStateOf(false)
    }

    val scope = rememberCoroutineScope()

    fun applyFilterAndSort() {

        var result = allData

        if (filterDateFrom.isNotBlank()) {
            result = result.filter { it.date >= filterDateFrom }
        }

        if (filterDateTo.isNotBlank()) {
            result = result.filter { it.date <= filterDateTo }
        }

        val minTempFilter = filterMinTemp.toDoubleOrNull()
        if (minTempFilter != null) {
            result = result.filter { it.minTemp >= minTempFilter }
        }

        val maxTempFilter = filterMaxTemp.toDoubleOrNull()
        if (maxTempFilter != null) {
            result = result.filter { it.maxTemp <= maxTempFilter }
        }

        result = when (sortBy) {
            "date" -> if (sortAscending) result.sortedBy { it.date } else result.sortedByDescending { it.date }
            "maxTemp" -> if (sortAscending) result.sortedBy { it.maxTemp } else result.sortedByDescending { it.maxTemp }
            "minTemp" -> if (sortAscending) result.sortedBy { it.minTemp } else result.sortedByDescending { it.minTemp }
            else -> result
        }

        filteredData = result
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
            .verticalScroll(rememberScrollState())
    ) {

        Text(
            "Zajem vremena",
            fontSize = 30.sp
        )

        Spacer(modifier = Modifier.height(20.dp))

        Row(
            verticalAlignment = Alignment.CenterVertically
        ) {

            OutlinedTextField(
                value = latitude,
                onValueChange = { latitude = it },
                label = { Text("Širina") },
                modifier = Modifier.width(160.dp)
            )

            Spacer(modifier = Modifier.width(12.dp))

            OutlinedTextField(
                value = longitude,
                onValueChange = { longitude = it },
                label = { Text("Dolžina") },
                modifier = Modifier.width(160.dp)
            )

            Spacer(modifier = Modifier.width(16.dp))

            Button(
                enabled = !loading,
                onClick = {

                    loading = true
                    error = null

                    scope.launch {

                        try {

                            val lat = latitude.toDoubleOrNull()
                                ?: throw IllegalArgumentException("Neveljavna širina.")
                            val lon = longitude.toDoubleOrNull()
                                ?: throw IllegalArgumentException("Neveljavna dolžina.")

                            val data = withContext(Dispatchers.IO) {
                                fetchWeatherData(lat, lon)
                            }

                            allData = data
                            applyFilterAndSort()

                        } catch (e: Exception) {
                            error = e.message ?: "Napaka pri pridobivanju vremenskih podatkov."
                        } finally {
                            loading = false
                        }
                    }
                }
            ) {
                Text(if (loading) "Pridobivam..." else "Pridobi vremenske podatke")
            }
        }

        if (error != null) {

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = "Napaka: $error",
                color = Color.Red
            )
        }

        if (allData.isNotEmpty()) {

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                "Filtri",
                fontSize = 24.sp
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {

                OutlinedTextField(
                    value = filterDateFrom,
                    onValueChange = { filterDateFrom = it },
                    label = { Text("Datum od (LLLL-MM-DD)") },
                    modifier = Modifier.width(200.dp)
                )

                Spacer(modifier = Modifier.width(12.dp))

                OutlinedTextField(
                    value = filterDateTo,
                    onValueChange = { filterDateTo = it },
                    label = { Text("Datum do (LLLL-MM-DD)") },
                    modifier = Modifier.width(200.dp)
                )

                Spacer(modifier = Modifier.width(12.dp))

                OutlinedTextField(
                    value = filterMinTemp,
                    onValueChange = { filterMinTemp = it },
                    label = { Text("Najnižja temp >=") },
                    modifier = Modifier.width(140.dp)
                )

                Spacer(modifier = Modifier.width(12.dp))

                OutlinedTextField(
                    value = filterMaxTemp,
                    onValueChange = { filterMaxTemp = it },
                    label = { Text("Najvišja temp <=") },
                    modifier = Modifier.width(140.dp)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {

                ExposedDropdownMenuBox(
                    expanded = sortDropdownExpanded,
                    onExpandedChange = { sortDropdownExpanded = !sortDropdownExpanded }
                ) {

                    OutlinedTextField(
                        value = when (sortBy) {
                            "date" -> "Datum"
                            "maxTemp" -> "Najvišja temp"
                            "minTemp" -> "Najnižja temp"
                            else -> sortBy
                        },
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Uredi po") },
                        trailingIcon = {
                            ExposedDropdownMenuDefaults.TrailingIcon(expanded = sortDropdownExpanded)
                        },
                        modifier = Modifier
                            .menuAnchor()
                            .width(180.dp)
                    )

                    ExposedDropdownMenu(
                        expanded = sortDropdownExpanded,
                        onDismissRequest = { sortDropdownExpanded = false }
                    ) {

                        DropdownMenuItem(
                            text = { Text("Datum") },
                            onClick = {
                                sortBy = "date"
                                sortDropdownExpanded = false
                            }
                        )

                        DropdownMenuItem(
                            text = { Text("Najvišja temp") },
                            onClick = {
                                sortBy = "maxTemp"
                                sortDropdownExpanded = false
                            }
                        )

                        DropdownMenuItem(
                            text = { Text("Najnižja temp") },
                            onClick = {
                                sortBy = "minTemp"
                                sortDropdownExpanded = false
                            }
                        )
                    }
                }

                Spacer(modifier = Modifier.width(12.dp))

                Button(
                    onClick = {
                        sortAscending = !sortAscending
                    }
                ) {
                    Text(if (sortAscending) "Naraščajoče" else "Padajoče")
                }

                Spacer(modifier = Modifier.width(16.dp))

                Button(
                    onClick = { applyFilterAndSort() }
                ) {
                    Text("Uporabi")
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                "Rezultati (${filteredData.size} / ${allData.size})",
                fontSize = 24.sp
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFE0E0E0))
                    .padding(12.dp)
            ) {

                Text(
                    "Datum",
                    modifier = Modifier.weight(1f),
                    fontSize = 16.sp
                )

                Text(
                    "Najvišja temp (°C)",
                    modifier = Modifier.weight(1f),
                    fontSize = 16.sp
                )

                Text(
                    "Najnižja temp (°C)",
                    modifier = Modifier.weight(1f),
                    fontSize = 16.sp
                )
            }

            filteredData.forEach { weather ->

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 8.dp)
                ) {

                    Text(
                        weather.date,
                        modifier = Modifier.weight(1f),
                        fontSize = 15.sp
                    )

                    Text(
                        "${weather.maxTemp}",
                        modifier = Modifier.weight(1f),
                        fontSize = 15.sp
                    )

                    Text(
                        "${weather.minTemp}",
                        modifier = Modifier.weight(1f),
                        fontSize = 15.sp
                    )
                }

                Divider(color = Color(0xFFE0E0E0))
            }
        }
    }
}

@Composable
fun GeneratorSelectionScreen(onOptionClick: (String) -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
    ) {
        Text("Generator", fontSize = 30.sp)

        Spacer(modifier = Modifier.height(20.dp))

        Text("Izberi tabelo:", fontSize = 18.sp)

        Spacer(modifier = Modifier.height(16.dp))

        Box(
            modifier = Modifier
                .fillMaxWidth(0.5f)
                .background(Color.White)
                .clickable { onOptionClick("generatorUser") }
                .padding(20.dp)
        ) {
            Column {
                Text("Uporabniki", fontSize = 22.sp)
                Spacer(modifier = Modifier.height(4.dp))
                Text("Generiranje naključnih uporabnikov", fontSize = 15.sp, color = Color.Gray)
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Box(
            modifier = Modifier
                .fillMaxWidth(0.5f)
                .background(Color.White)
                .clickable { onOptionClick("generatorParcela") }
                .padding(20.dp)
        ) {
            Column {
                Text("Parcele", fontSize = 22.sp)
                Spacer(modifier = Modifier.height(4.dp))
                Text("Generiranje naključnih parcel", fontSize = 15.sp, color = Color.Gray)
            }
        }
    }
}

@Composable
fun GeneratorScreen(title: String, onBack: () -> Unit) {
    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.White)
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Nazaj", tint = Color(0xFF222222))
            }
            Spacer(modifier = Modifier.width(8.dp))
            Text(title, fontSize = 20.sp, color = Color(0xFF222222))
        }

        Divider(color = Color(0xFFE0E0E0))

        Box(modifier = Modifier.fillMaxSize().padding(32.dp)) {
            Text("Generator za \"$title\" — kmalu na voljo.", fontSize = 14.sp, color = Color(0xFF888888))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GeneratorUserScreen(onBack: () -> Unit) {
    var count by remember { mutableStateOf("5") }
    var loading by remember { mutableStateOf(false) }
    var generated by remember { mutableStateOf(0) }
    var total by remember { mutableStateOf(0) }
    var done by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.White)
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Nazaj", tint = Color(0xFF222222))
            }
            Spacer(modifier = Modifier.width(8.dp))
            Text("Generator uporabnikov", fontSize = 20.sp, color = Color(0xFF222222))
        }

        Divider(color = Color(0xFFE0E0E0))

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(32.dp)
        ) {
            Text("Število zapisov", fontSize = 18.sp)

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = count,
                onValueChange = {
                    count = it.filter { c -> c.isDigit() }
                    done = false
                    error = null
                },
                label = { Text("Količina") },
                modifier = Modifier.width(200.dp)
            )

            Spacer(modifier = Modifier.height(32.dp))

            Button(
                enabled = !loading && count.toIntOrNull()?.let { it > 0 } == true,
                onClick = {
                    val n = count.toIntOrNull() ?: return@Button
                    loading = true
                    done = false
                    error = null
                    generated = 0
                    total = n

                    scope.launch {
                        try {
                            val faker = Faker()
                            repeat(n) {
                                val firstName = faker.name.firstName()
                                val lastName = faker.name.lastName()
                                val num = Random.nextInt(100, 9999)
                                val email = "${firstName.lowercase()}.${lastName.lowercase()}$num@example.com"
                                withContext(Dispatchers.IO) {
                                    UserApi.addUser(
                                        UserRequest(
                                            name = "$firstName $lastName",
                                            email = email,
                                            password = "Geslo$num!"
                                        )
                                    )
                                }
                                generated++
                            }
                            done = true
                        } catch (e: Exception) {
                            error = e.message
                        } finally {
                            loading = false
                        }
                    }
                }
            ) {
                Text(if (loading) "Generiranje... ($generated / $total)" else "Generiraj")
            }

            if (done) {
                Spacer(modifier = Modifier.height(16.dp))
                Text("Uspešno generirano $total uporabnikov.", color = Color(0xFF1A4D3A), fontSize = 14.sp)
            }

            if (error != null) {
                Spacer(modifier = Modifier.height(16.dp))
                Text("Napaka: $error", color = Color.Red, fontSize = 14.sp)
            }
        }
    }
}

fun generatePolygon(latMin: Double, latMax: Double, lngMin: Double, lngMax: Double): Coordinates {
    val lat = Random.nextDouble(latMin, latMax)
    val lng = Random.nextDouble(lngMin, lngMax)
    val size = Random.nextDouble(0.002, 0.008)
    val ring = listOf(
        listOf(lng, lat),
        listOf(lng + size, lat),
        listOf(lng + size, lat + size),
        listOf(lng, lat + size),
        listOf(lng, lat)
    )
    return Coordinates(type = "Polygon", coordinates = listOf(ring))
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GeneratorParcelaScreen(onBack: () -> Unit) {
    var count by remember { mutableStateOf("5") }
    var latMin by remember { mutableStateOf("45.8") }
    var latMax by remember { mutableStateOf("46.9") }
    var lngMin by remember { mutableStateOf("13.4") }
    var lngMax by remember { mutableStateOf("16.6") }
    var loading by remember { mutableStateOf(false) }
    var generated by remember { mutableStateOf(0) }
    var total by remember { mutableStateOf(0) }
    var done by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.White)
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Nazaj", tint = Color(0xFF222222))
            }
            Spacer(modifier = Modifier.width(8.dp))
            Text("Generator parcel", fontSize = 20.sp, color = Color(0xFF222222))
        }

        Divider(color = Color(0xFFE0E0E0))

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(32.dp)
        ) {
            Text("Število zapisov", fontSize = 18.sp)

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = count,
                onValueChange = {
                    count = it.filter { c -> c.isDigit() }
                    done = false
                    error = null
                },
                label = { Text("Količina") },
                modifier = Modifier.width(200.dp)
            )

            Spacer(modifier = Modifier.height(24.dp))

            Text("Območje koordinat", fontSize = 18.sp)

            Spacer(modifier = Modifier.height(12.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(
                    value = latMin,
                    onValueChange = { latMin = it },
                    label = { Text("Širina min") },
                    modifier = Modifier.width(160.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                OutlinedTextField(
                    value = latMax,
                    onValueChange = { latMax = it },
                    label = { Text("Širina max") },
                    modifier = Modifier.width(160.dp)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(
                    value = lngMin,
                    onValueChange = { lngMin = it },
                    label = { Text("Dolžina min") },
                    modifier = Modifier.width(160.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                OutlinedTextField(
                    value = lngMax,
                    onValueChange = { lngMax = it },
                    label = { Text("Dolžina max") },
                    modifier = Modifier.width(160.dp)
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            Button(
                enabled = !loading && count.toIntOrNull()?.let { it > 0 } == true,
                onClick = {
                    val n = count.toIntOrNull() ?: return@Button
                    val latMinD = latMin.toDoubleOrNull() ?: return@Button
                    val latMaxD = latMax.toDoubleOrNull() ?: return@Button
                    val lngMinD = lngMin.toDoubleOrNull() ?: return@Button
                    val lngMaxD = lngMax.toDoubleOrNull() ?: return@Button

                    loading = true
                    done = false
                    error = null
                    generated = 0
                    total = n

                    scope.launch {
                        try {
                            repeat(n) {
                                val gerkPid = Random.nextLong(100_000_000L, 999_999_999L).toString()
                                val raba = rabaOptions.random()
                                val coords = generatePolygon(latMinD, latMaxD, lngMinD, lngMaxD)

                                withContext(Dispatchers.IO) {
                                    ParcelApi.addParcel(
                                        ParcelRequest(
                                            name = "Parcela $gerkPid",
                                            color = "#3B7A57",
                                            gerk_pid = gerkPid,
                                            typeOfUse = landUseForApi(raba),
                                            coordinates = coords
                                        )
                                    )
                                }
                                generated++
                            }
                            done = true
                        } catch (e: Exception) {
                            error = e.message
                        } finally {
                            loading = false
                        }
                    }
                }
            ) {
                Text(if (loading) "Generiranje... ($generated / $total)" else "Generiraj")
            }

            if (done) {
                Spacer(modifier = Modifier.height(16.dp))
                Text("Uspešno generirano $total parcel.", color = Color(0xFF1A4D3A), fontSize = 14.sp)
            }

            if (error != null) {
                Spacer(modifier = Modifier.height(16.dp))
                Text("Napaka: $error", color = Color.Red, fontSize = 14.sp)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun GerkScraperScreen() {
    var allFeatures by remember { mutableStateOf<List<FeatureItem>>(emptyList()) }
    var filteredFeatures by remember { mutableStateOf<List<FeatureItem>>(emptyList()) }
    var loading by remember { mutableStateOf(false) }
    var saving by remember { mutableStateOf(false) }
    var savedCount by remember { mutableStateOf<Int?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var filterType by remember { mutableStateOf("Vse") }
    var searchPid by remember { mutableStateOf("") }
    var sortBy by remember { mutableStateOf("gerkPID") }
    var sortAscending by remember { mutableStateOf(true) }
    var filterDropdownExpanded by remember { mutableStateOf(false) }
    var sortDropdownExpanded by remember { mutableStateOf(false) }
    var pageSizeDropdownExpanded by remember { mutableStateOf(false) }
    var pageSize by remember { mutableStateOf(50) }
    var pageIndex by remember { mutableStateOf(0) }
    var selectedGerkIds by remember { mutableStateOf<Set<Long>>(emptySet()) }
    val scope = rememberCoroutineScope()

    val typeOptions = remember(allFeatures) {
        listOf("Vse") + allFeatures.map { it.typeOfUse }.distinct().sorted()
    }

    fun applyFilterAndSort(source: List<FeatureItem> = allFeatures) {
        var result = if (filterType == "Vse") source else source.filter { it.typeOfUse == filterType }
        if (searchPid.isNotBlank()) result = result.filter { it.gerkPID.toString().contains(searchPid.trim()) }
        result = when (sortBy) {
            "gerkPID"   -> if (sortAscending) result.sortedBy { it.gerkPID } else result.sortedByDescending { it.gerkPID }
            "typeOfUse" -> if (sortAscending) result.sortedBy { it.typeOfUse } else result.sortedByDescending { it.typeOfUse }
            "points"    -> if (sortAscending) result.sortedBy { it.coordinates.size } else result.sortedByDescending { it.coordinates.size }
            else -> result
        }
        filteredFeatures = result
        selectedGerkIds = selectedGerkIds.intersect(result.map { it.gerkPID }.toSet())
        pageIndex = 0
    }

    val pageCount = if (filteredFeatures.isEmpty()) 1 else ((filteredFeatures.size + pageSize - 1) / pageSize)
    val safePageIndex = pageIndex.coerceIn(0, pageCount - 1)
    val pageFeatures = filteredFeatures.drop(safePageIndex * pageSize).take(pageSize)
    val pageIds = pageFeatures.map { it.gerkPID }.toSet()
    val allPageSelected = pageIds.isNotEmpty() && selectedGerkIds.containsAll(pageIds)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Text("Zajem GERK parcel", fontSize = 30.sp)

        Spacer(modifier = Modifier.height(20.dp))

        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                enabled = !loading,
                onClick = {
                    loading = true
                    error = null
                    savedCount = null
                    selectedGerkIds = emptySet()
                    pageIndex = 0
                    scope.launch {
                        try {
                            val parsed = withContext(Dispatchers.IO) {
                                val candidates = listOf(
                                    File("../../vaja1/obdelovalnikPodatkov/field.json"),
                                    File("../vaja1/obdelovalnikPodatkov/field.json"),
                                    File("field.json")
                                )
                                val f = candidates.firstOrNull { it.exists() } ?: File("field.json")
                                loadGerkFeatures(f).filter { it.coordinates.size >= 4 }
                            }
                            allFeatures = parsed
                            applyFilterAndSort(parsed)
                        } catch (e: Exception) {
                            error = e.message
                        } finally {
                            loading = false
                        }
                    }
                }
            ) {
                Text(if (loading) "Nalagam..." else "Naloži podatke")
            }

            if (allFeatures.isNotEmpty()) {
                Text("Skupaj: ${allFeatures.size}", fontSize = 14.sp, color = Color.Gray)
            }
        }

        if (error != null) {
            Spacer(modifier = Modifier.height(12.dp))
            Text("Napaka: $error", color = Color.Red)
        }

        if (allFeatures.isNotEmpty()) {
            Spacer(modifier = Modifier.height(24.dp))

            Text("Filtri in urejanje", fontSize = 22.sp)
            Spacer(modifier = Modifier.height(12.dp))

            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = searchPid,
                    onValueChange = { searchPid = it; applyFilterAndSort() },
                    label = { Text("Išči GERK PID") },
                    modifier = Modifier.widthIn(min = 180.dp, max = 240.dp)
                )

                ExposedDropdownMenuBox(
                    expanded = filterDropdownExpanded,
                    onExpandedChange = { filterDropdownExpanded = !filterDropdownExpanded }
                ) {
                    OutlinedTextField(
                        value = filterType,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Tip rabe") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = filterDropdownExpanded) },
                        modifier = Modifier.menuAnchor().widthIn(min = 190.dp, max = 260.dp)
                    )
                    ExposedDropdownMenu(
                        expanded = filterDropdownExpanded,
                        onDismissRequest = { filterDropdownExpanded = false }
                    ) {
                        typeOptions.forEach { option ->
                            DropdownMenuItem(
                                text = { Text(option) },
                                onClick = {
                                    filterType = option
                                    filterDropdownExpanded = false
                                    applyFilterAndSort()
                                }
                            )
                        }
                    }
                }

                ExposedDropdownMenuBox(
                    expanded = sortDropdownExpanded,
                    onExpandedChange = { sortDropdownExpanded = !sortDropdownExpanded }
                ) {
                    OutlinedTextField(
                        value = when (sortBy) {
                            "gerkPID"   -> "GERK PID"
                            "typeOfUse" -> "Tip rabe"
                            "points"    -> "Št. točk"
                            else        -> sortBy
                        },
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Uredi po") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = sortDropdownExpanded) },
                        modifier = Modifier.menuAnchor().widthIn(min = 170.dp, max = 220.dp)
                    )
                    ExposedDropdownMenu(
                        expanded = sortDropdownExpanded,
                        onDismissRequest = { sortDropdownExpanded = false }
                    ) {
                        DropdownMenuItem(text = { Text("GERK PID") }, onClick = {
                            sortBy = "gerkPID"; sortDropdownExpanded = false; applyFilterAndSort()
                        })
                        DropdownMenuItem(text = { Text("Tip rabe") }, onClick = {
                            sortBy = "typeOfUse"; sortDropdownExpanded = false; applyFilterAndSort()
                        })
                        DropdownMenuItem(text = { Text("Št. točk") }, onClick = {
                            sortBy = "points"; sortDropdownExpanded = false; applyFilterAndSort()
                        })
                    }
                }

                Button(onClick = { sortAscending = !sortAscending; applyFilterAndSort() }) {
                    Text(if (sortAscending) "Naraščajoče" else "Padajoče")
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("Prikaz na stran:", fontSize = 14.sp, color = TextMuted)

                ExposedDropdownMenuBox(
                    expanded = pageSizeDropdownExpanded,
                    onExpandedChange = { pageSizeDropdownExpanded = !pageSizeDropdownExpanded }
                ) {
                    OutlinedTextField(
                        value = pageSize.toString(),
                        onValueChange = {},
                        readOnly = true,
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = pageSizeDropdownExpanded) },
                        modifier = Modifier.menuAnchor().width(110.dp)
                    )
                    ExposedDropdownMenu(
                        expanded = pageSizeDropdownExpanded,
                        onDismissRequest = { pageSizeDropdownExpanded = false }
                    ) {
                        listOf(10, 50, 100, 200).forEach { size ->
                            DropdownMenuItem(
                                text = { Text(size.toString()) },
                                onClick = {
                                    pageSize = size
                                    pageIndex = 0
                                    pageSizeDropdownExpanded = false
                                }
                            )
                        }
                    }
                }

                IconButton(
                    enabled = safePageIndex > 0,
                    onClick = { pageIndex = (pageIndex - 1).coerceAtLeast(0) }
                ) {
                    Icon(Icons.Default.KeyboardArrowLeft, contentDescription = "Prejšnja stran")
                }

                Text("Stran ${safePageIndex + 1} / $pageCount", fontSize = 14.sp, color = TextMuted)

                IconButton(
                    enabled = safePageIndex < pageCount - 1,
                    onClick = { pageIndex = (pageIndex + 1).coerceAtMost(pageCount - 1) }
                ) {
                    Icon(Icons.Default.KeyboardArrowRight, contentDescription = "Naslednja stran")
                }

                Text("Označeno: ${selectedGerkIds.size}", fontSize = 14.sp, color = TextMuted)
            }

            Spacer(modifier = Modifier.height(16.dp))

            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    "Rezultati (${filteredFeatures.size} / ${allFeatures.size})",
                    fontSize = 22.sp,
                    modifier = Modifier.widthIn(min = 220.dp)
                )

                Button(
                    enabled = !saving && selectedGerkIds.isNotEmpty(),
                    onClick = {
                        saving = true
                        savedCount = null
                        error = null
                        val toSave = filteredFeatures.filter { selectedGerkIds.contains(it.gerkPID) }
                        scope.launch {
                            try {
                                var count = 0
                                toSave.forEach { feature ->
                                    val ring = feature.coordinates
                                        .filter { it.size >= 2 }
                                        .map { listOf(it[0], it[1]) }
                                        .toMutableList()
                                    if (ring.size < 4) return@forEach
                                    if (ring.isNotEmpty() && ring.first() != ring.last()) ring.add(ring.first())
                                    withContext(Dispatchers.IO) {
                                        ParcelApi.addParcel(
                                            ParcelRequest(
                                                name = "GERK ${feature.gerkPID}",
                                                color = "#3B7A57",
                                                gerk_pid = feature.gerkPID.toString(),
                                                typeOfUse = landUseForApi(feature.rabaId, feature.typeOfUse),
                                                coordinates = Coordinates(
                                                    type = "Polygon",
                                                    coordinates = listOf(ring)
                                                )
                                            )
                                        )
                                    }
                                    count++
                                }
                                savedCount = count
                                selectedGerkIds = emptySet()
                            } catch (e: Exception) {
                                error = e.message
                            } finally {
                                saving = false
                            }
                        }
                    }
                ) {
                    Text(if (saving) "Shranjujem..." else "Shrani označene za uporabnika")
                }
            }

            if (savedCount != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Text("Shranjeno $savedCount parcel.", color = Color(0xFF1A4D3A), fontSize = 14.sp)
            }

            Spacer(modifier = Modifier.height(12.dp))

            BoxWithConstraints(modifier = Modifier.fillMaxWidth()) {
                val compactRows = maxWidth < 560.dp

                Column(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFE0E0E0))
                    .padding(12.dp)
            ) {
                Checkbox(
                    checked = allPageSelected,
                    onCheckedChange = { checked ->
                        selectedGerkIds = if (checked) {
                            selectedGerkIds + pageIds
                        } else {
                            selectedGerkIds - pageIds
                        }
                    },
                    modifier = if (compactRows) Modifier else Modifier.weight(0.5f)
                )
                Text(if (compactRows) "GERK PID / raba" else "GERK PID", modifier = Modifier.weight(1f), fontSize = 15.sp)
                if (!compactRows) {
                    Text("Tip rabe", modifier = Modifier.weight(2f), fontSize = 15.sp)
                Text("Št. točk", modifier = Modifier.weight(1f), fontSize = 15.sp)
            }

                }

            pageFeatures.forEach { feature ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(
                        checked = selectedGerkIds.contains(feature.gerkPID),
                        onCheckedChange = { checked ->
                            selectedGerkIds = if (checked) {
                                selectedGerkIds + feature.gerkPID
                            } else {
                                selectedGerkIds - feature.gerkPID
                            }
                        },
                        modifier = if (compactRows) Modifier else Modifier.weight(0.5f)
                    )
                    Text(
                        if (compactRows) "${feature.gerkPID}\n${feature.typeOfUse}\n${feature.coordinates.size} točk" else "${feature.gerkPID}",
                        modifier = Modifier.weight(1f),
                        fontSize = 14.sp
                    )
                    if (!compactRows) {
                        Text(feature.typeOfUse, modifier = Modifier.weight(2f), fontSize = 14.sp)
                        Text("${feature.coordinates.size}", modifier = Modifier.weight(1f), fontSize = 14.sp)
                    }
                }
                Divider(color = Color(0xFFE0E0E0))
            }
            }
            }

            if (filteredFeatures.size > pageSize) {
                Spacer(modifier = Modifier.height(8.dp))
                val firstShown = if (filteredFeatures.isEmpty()) 0 else safePageIndex * pageSize + 1
                val lastShown = minOf((safePageIndex + 1) * pageSize, filteredFeatures.size)
                Text("Prikazano $firstShown-$lastShown od ${filteredFeatures.size} zadetkov.", fontSize = 13.sp, color = Color.Gray)
            }
        }
    }
}
