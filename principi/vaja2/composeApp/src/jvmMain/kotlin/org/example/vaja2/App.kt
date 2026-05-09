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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import parser.mapRaba

@Serializable
data class Parcel(
    val id: String,
    val gerk_pid: String,
    val typeOfUse: String,
    val coordinates: Coordinates,
    val createdAt: String? = null,
    val userId: String? = null
)

@Serializable
data class Coordinates(
    val type: String,
    val coordinates: List<List<List<Double>>>
)

@Serializable
data class ParcelRequest(
    val gerk_pid: String,
    val typeOfUse: String,
    val coordinates: Coordinates
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

object ParcelApi {

    private const val BASE_URL = "http://localhost:5001/api/parcele"

    private val client = HttpClient(CIO) {
        install(ContentNegotiation) {
            json(Json { ignoreUnknownKeys = true })
        }
    }

    suspend fun getAllParcels(): List<Parcel> {
        return client.get(BASE_URL).body()
    }

    suspend fun addParcel(request: ParcelRequest): Parcel {
        return client.post(BASE_URL) {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body()
    }

    suspend fun updateParcel(id: String, request: ParcelRequest): Parcel {
        return client.put("$BASE_URL/$id") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body()
    }

    suspend fun deleteParcel(id: String) {
        client.delete("$BASE_URL/$id")
    }
}

@Composable
fun App() {

    var selectedScreen by remember {
        mutableStateOf("home")
    }

    MaterialTheme {

        Row(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.White)
        ) {

            LeftMenu(
                onAddParcelClick = {
                    selectedScreen = "addParcel"
                },
                onParcelsClick = {
                    selectedScreen = "parcels"
                }
            )

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xFFF5F5F5))
            ) {

                when (selectedScreen) {

                    "addParcel" -> AddParcelScreen(
                        onParcelSaved = {
                            selectedScreen = "parcels"
                        }
                    )

                    "parcels" -> ParcelsScreen()

                    else -> Text(
                        text = "Content area",
                        modifier = Modifier.padding(24.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun LeftMenu(
    onAddParcelClick: () -> Unit,
    onParcelsClick: () -> Unit
) {

    Column(
        modifier = Modifier
            .width(260.dp)
            .fillMaxHeight()
            .background(Color.White)
            .padding(top = 16.dp)
    ) {

        MenuItem(Icons.Default.Add, "Add parcel", onClick = onAddParcelClick)
        MenuItem(Icons.Default.List, "Parcels", onClick = onParcelsClick)

        DividerLine()

        MenuItem(Icons.Default.Add, "Add user")
        MenuItem(Icons.Default.List, "Users")

        DividerLine()

        MenuItem(Icons.Default.Share, "Scraper")
        MenuItem(Icons.Default.Build, "Generator")

        DividerLine()

        MenuItem(Icons.Default.Info, "About")
    }
}

@Composable
fun MenuItem(
    icon: ImageVector,
    text: String,
    onClick: () -> Unit = {}
) {

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(72.dp)
            .clickable { onClick() }
            .padding(horizontal = 24.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {

        Icon(
            imageVector = icon,
            contentDescription = text,
            tint = Color.Black,
            modifier = Modifier.size(26.dp)
        )

        Spacer(modifier = Modifier.width(20.dp))

        Text(
            text = text,
            fontSize = 18.sp,
            color = Color(0xFF222222)
        )
    }
}

@Composable
fun DividerLine() {

    Divider(
        modifier = Modifier.padding(start = 56.dp),
        color = Color(0xFFE0E0E0),
        thickness = 1.dp
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddParcelScreen(
    parcelToEdit: Parcel? = null,
    onParcelSaved: () -> Unit
) {

    var gerkPid by remember {
        mutableStateOf(parcelToEdit?.gerk_pid ?: "")
    }

    var selectedRaba by remember {
        mutableStateOf(
            rabaOptions.firstOrNull {
                it.id.toString() == parcelToEdit?.typeOfUse
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
            text = if (parcelToEdit == null) "Add Parcel" else "Update Parcel",
            fontSize = 30.sp
        )

        Spacer(modifier = Modifier.height(24.dp))

        OutlinedTextField(
            value = gerkPid,
            onValueChange = {
                gerkPid = it
            },
            label = {
                Text("GERK PID")
            },
            modifier = Modifier.fillMaxWidth(0.6f)
        )

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
                    Text("Type Of Use")
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

        Text("Polygon coordinates", fontSize = 24.sp)

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
                        Text("Longitude")
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
                        Text("Latitude")
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
                    Text("Remove")
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Button(
            onClick = {
                points = points + CoordinatePoint()
            }
        ) {
            Text("Add point")
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            enabled = !loading,
            onClick = {

                loading = true
                error = null

                scope.launch {

                    try {

                        if (gerkPid.isBlank()) {
                            throw IllegalArgumentException("GERK PID is required.")
                        }

                        val polygonPoints = points.map { point ->

                            val longitude = point.longitude.toDoubleOrNull()
                                ?: throw IllegalArgumentException("Invalid longitude.")

                            val latitude = point.latitude.toDoubleOrNull()
                                ?: throw IllegalArgumentException("Invalid latitude.")

                            listOf(longitude, latitude)

                        }.toMutableList()

                        val firstPoint = polygonPoints.first()
                        val lastPoint = polygonPoints.last()

                        if (firstPoint != lastPoint) {
                            polygonPoints.add(firstPoint)
                        }

                        val request = ParcelRequest(
                            gerk_pid = gerkPid,
                            typeOfUse = selectedRaba.id.toString(),
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
                    "Saving..."
                else if (parcelToEdit == null)
                    "Add parcel"
                else
                    "Update parcel"
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        if (error != null) {

            Text(
                text = "Error: $error",
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
            "Parcels",
            fontSize = 30.sp
        )

        Spacer(modifier = Modifier.height(20.dp))

        when {

            loading -> Text("Loading...")

            error != null -> Text(
                text = "Error: $error",
                color = Color.Red
            )

            parcels.isEmpty() -> Text("No parcels found.")

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
                                text = "GERK PID: ${parcel.gerk_pid}",
                                fontSize = 20.sp
                            )

                            Spacer(modifier = Modifier.height(4.dp))

                            Text(
                                text = "Type: ${mapRaba(parcel.typeOfUse.toInt())}",
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
fun ParcelDetails(
    parcel: Parcel?,
    onUpdateClick: (Parcel) -> Unit,
    onDeleteClick: (Parcel) -> Unit,
    modifier: Modifier = Modifier
) {

    Box(
        modifier = modifier
            .background(Color.White)
            .padding(24.dp)
    ) {

        if (parcel == null) {

            Text(
                "Select a parcel",
                fontSize = 24.sp
            )

        } else {

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
            ) {

                Text(
                    "Detailed Information",
                    fontSize = 30.sp
                )

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    "GERK PID:",
                    fontSize = 18.sp
                )

                Text(
                    parcel.gerk_pid,
                    fontSize = 16.sp
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    "Type Of Use:",
                    fontSize = 18.sp
                )

                Text(
                    "${parcel.typeOfUse} - ${mapRaba(parcel.typeOfUse.toInt())}",
                    fontSize = 16.sp
                )

                Spacer(modifier = Modifier.height(24.dp))

                Row {

                    Button(
                        onClick = {
                            onUpdateClick(parcel)
                        }
                    ) {
                        Text("Update")
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Button(
                        onClick = {
                            onDeleteClick(parcel)
                        }
                    ) {
                        Text("Delete")
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    "Coordinates:",
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