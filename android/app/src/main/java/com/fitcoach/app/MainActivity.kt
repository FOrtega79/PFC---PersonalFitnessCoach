package com.fitcoach.app

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Handle widget deep links if launched with fitcoach:// URL schemes
        intent?.data?.let { uri ->
            bridge?.let { b ->
                val path = uri.path ?: "/"
                val query = uri.query?.let { "?$it" } ?: ""
                b.webView?.evaluateJavascript("window.location.href = '$path$query';", null)
            }
        }
    }
}
