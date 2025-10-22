package com.lavanderiaapp.rfid

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.util.Log
// SDK típico de C72 (ajusta si tu AAR expone otros paquetes)
import com.rscja.deviceapi.RFIDWithUHFA4
import com.rscja.deviceapi.entity.UHFTAGInfo

class RFIDModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var isScanning = false
    private var power = 26
    private var uhf: RFIDWithUHFA4? = null
    private var readThread: Thread? = null

    override fun getName(): String {
        return "RFIDModule"
    }

    // Requeridos por NativeEventEmitter (aunque no hagan nada)
    @ReactMethod
    fun addListener(eventName: String) { /* no-op */ }

    @ReactMethod
    fun removeListeners(count: Int) { /* no-op */ }

    @ReactMethod
    fun startScan(promise: Promise) {
        try {
            if (isScanning) { promise.resolve(null); return }
            isScanning = true
            Log.d("RFIDModule", "Escaneo RFID iniciado")

            if (uhf == null) {
                uhf = RFIDWithUHFA4.getInstance()
                if (uhf?.init(reactApplicationContext) != true) {
                    isScanning = false
                    promise.reject("RFID_INIT_FAILED", "No se pudo inicializar el UHF")
                    return
                }
                try { uhf?.setPower(power) } catch (_: Exception) {}
            }

            if (uhf?.startInventoryTag() != true) {
                isScanning = false
                promise.reject("RFID_START_FAILED", "startInventoryTag() falló")
                return
            }

            readThread = Thread {
                try {
                    while (isScanning) {
                        val tag: UHFTAGInfo? = uhf?.readTagFromBuffer()
                        if (tag != null) {
                            val epc = try { tag.epc ?: tag.getEPC() } catch (_: Exception) { null }
                            if (epc != null) {
                                val rssi = try {
                                    when {
                                        tag.rssi is String -> (tag.rssi as String).toIntOrNull() ?: -65
                                        else -> tag.getRssi()?.toIntOrNull() ?: -65
                                    }
                                } catch (_: Exception) { -65 }
                                sendTagScannedEvent(epc, rssi)
                            }
                        } else {
                            try { Thread.sleep(30) } catch (_: InterruptedException) { break }
                        }
                    }
                } catch (e: Exception) {
                    Log.e("RFIDModule", "Error en hilo de lectura", e)
                }
            }.apply { start() }

            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("RFID_ERROR", "Error al iniciar escaneo: ${e.message}", e)
        }
    }

    @ReactMethod
    fun stopScan(promise: Promise) {
        try {
            if (!isScanning) { promise.resolve(null); return }
            isScanning = false
            Log.d("RFIDModule", "Escaneo RFID detenido")

            try { uhf?.stopInventory() } catch (_: Exception) {}
            try { readThread?.interrupt() } catch (_: Exception) {}
            readThread = null

            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("RFID_ERROR", "Error al detener escaneo: ${e.message}", e)
        }
    }

    @ReactMethod
    fun isScanning(promise: Promise) {
        promise.resolve(isScanning)
    }

    @ReactMethod
    fun getPower(promise: Promise) {
        promise.resolve(power)
    }

    @ReactMethod
    fun setPower(newPower: Int, promise: Promise) {
        try {
            power = newPower
            Log.d("RFIDModule", "Potencia RFID establecida a: $power")
            
            // TODO: Integrar con DeviceAPI_ver20250209_release.aar
            // Ejemplo: rfidReader.setPower(power)
            
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("RFID_ERROR", "Error al establecer potencia: ${e.message}", e)
        }
    }

    private fun sendTagScannedEvent(epc: String, rssi: Int) {
        val params = Arguments.createMap().apply {
            putString("epc", epc)
            putInt("rssi", rssi)
            putDouble("timestamp", System.currentTimeMillis().toDouble())
        }

        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("onTagScanned", params)
    }

    private fun sendScanError(message: String) {
        val params = Arguments.createMap().apply {
            putString("message", message)
        }

        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("onScanError", params)
    }
}

