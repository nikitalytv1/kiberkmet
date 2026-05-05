package org.example.vaja2

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.safeContentPadding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import org.jetbrains.compose.resources.painterResource
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.Divider
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Icon
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

import vaja2.composeapp.generated.resources.Res
import vaja2.composeapp.generated.resources.compose_multiplatform

@Composable
fun App() {
    MaterialTheme {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.White)
        ) {
            LeftMenu()

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xFFF5F5F5))
            ) {
                Text(
                    text = "Content area",
                    modifier = Modifier.padding(24.dp)
                )
            }
        }
    }
}

@Composable
fun LeftMenu() {
    Column(
        modifier = Modifier
            .width(280.dp)
            .fillMaxHeight()
            .background(Color.White)
            .padding(top = 16.dp)
    ) {
        MenuItem(Icons.Default.Add, "Add parcel")
        MenuItem(Icons.Default.List, "Parcels")

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
            .padding(horizontal = 28.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = text,
            tint = Color.Black,
            modifier = Modifier.size(26.dp)
        )

        Spacer(modifier = Modifier.width(28.dp))

        Text(
            text = text,
            fontSize = 20.sp,
            color = Color(0xFF222222)
        )
    }
}

@Composable
fun DividerLine() {
    Divider(
        modifier = Modifier.padding(start = 64.dp),
        color = Color(0xFFE0E0E0),
        thickness = 1.dp
    )
}