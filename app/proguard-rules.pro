# Add project specific ProGuard rules here.
# By default, the flags in this file are applied to all build types, but
# you can include them only in the specific build type if you need.

# Keep Retrofit2 model classes
-keepattributes Signature
-keepattributes *Annotation*
-keep class retrofit2.** { *; }
-keepclasseswithmembers class * {
    @retrofit2.http.* <methods>;
}

# Keep Gson model classes (all POJOs in com.subastapp.model)
-keep class com.subastapp.model.** { *; }
-keep class com.google.gson.** { *; }
-keepattributes Exceptions

# Keep STOMP WebSocket
-keep class ua.naiksoftware.stomp.** { *; }
-keep class io.reactivex.** { *; }

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**

# Glide
-keep public class * implements com.bumptech.glide.module.GlideModule
-keep class * extends com.bumptech.glide.module.AppGlideModule { *; }

# Navigation
-keepnames class androidx.navigation.fragment.NavHostFragment
