package com.lavanderiaapp.rfid

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.util.Log

class RFIDModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var isScanning = false
    private var power = 26

    override fun getName(): String {
        return "RFIDModule"
    }

    @ReactMethod
    fun startScan(promise: Promise) {
        try {
            isScanning = true
            Log.d("RFIDModule", "Escaneo RFID iniciado")
            
            // TODO: Integrar con DeviceAPI_ver20250209_release.aar
            // Aquí deberías llamar a los métodos del módulo nativo RFID
            // Ejemplo: rfidReader.startInventory()
            
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("RFID_ERROR", "Error al iniciar escaneo: ${e.message}", e)
        }
    }

    @ReactMethod
    fun stopScan(promise: Promise) {
        try {
            isScanning = false
            Log.d("RFIDModule", "Escaneo RFID detenido")
            
            // TODO: Integrar con DeviceAPI_ver20250209_release.aar
            // Ejemplo: rfidReader.stopInventory()
            
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

