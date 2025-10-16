package com.lavanderiaapp

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import android.view.KeyEvent
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "lavanderiaapp"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  private fun emitHardwareTriggerEvent(eventName: String) {
    val context: ReactContext? = this.reactInstanceManager?.currentReactContext
    context?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      ?.emit(eventName, null)
  }

  override fun dispatchKeyEvent(event: KeyEvent): Boolean {
    // Chainway C72 suele usar KEYCODE_F1/F2/F3 o SCAN
    val isTriggerKey = when (event.keyCode) {
      KeyEvent.KEYCODE_F1, KeyEvent.KEYCODE_F2, KeyEvent.KEYCODE_F3,
      KeyEvent.KEYCODE_BUTTON_L1, KeyEvent.KEYCODE_BUTTON_R1 -> true
      else -> false
    }

    // Considerar también keyCode 293 (gatillo en ciertos C72)
    if (isTriggerKey || event.keyCode == 293) {
      if (event.action == KeyEvent.ACTION_DOWN && event.repeatCount == 0) {
        emitHardwareTriggerEvent("hwTriggerDown")
        return true
      }
      if (event.action == KeyEvent.ACTION_UP) {
        emitHardwareTriggerEvent("hwTriggerUp")
        return true
      }
    }
    return super.dispatchKeyEvent(event)
  }
}

