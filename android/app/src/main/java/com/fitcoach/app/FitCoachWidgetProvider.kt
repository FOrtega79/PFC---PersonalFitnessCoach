package com.fitcoach.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.widget.RemoteViews

class FitCoachWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_UPDATE_WIDGET_DATA) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val thisWidget = ComponentName(context, FitCoachWidgetProvider::class.java)
            val allWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget)
            for (id in allWidgetIds) {
                updateAppWidget(context, appWidgetManager, id)
            }
        }
    }

    companion object {
        const val ACTION_UPDATE_WIDGET_DATA = "com.fitcoach.app.ACTION_UPDATE_WIDGET_DATA"
        private const val PREFS_NAME = "FitCoachWidgetPrefs"

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val isWorkoutDone = prefs.getBoolean("workout_done", false)
            val isPhotoLogged = prefs.getBoolean("photo_logged", false)
            val streak = prefs.getInt("streak", 1)
            val goal = prefs.getString("goal_status", "Active") ?: "Active"

            val views = RemoteViews(context.packageName, R.layout.widget_at_a_glance)

            // Update Workout status
            if (isWorkoutDone) {
                views.setTextViewText(R.id.widget_workout_status, "Done")
                views.setTextColor(R.id.widget_workout_status, Color.parseColor("#34D399"))
            } else {
                views.setTextViewText(R.id.widget_workout_status, "Pending")
                views.setTextColor(R.id.widget_workout_status, Color.parseColor("#FBBF24"))
            }

            // Update Photo status
            if (isPhotoLogged) {
                views.setTextViewText(R.id.widget_photo_status, "Logged")
                views.setTextColor(R.id.widget_photo_status, Color.parseColor("#34D399"))
            } else {
                views.setTextViewText(R.id.widget_photo_status, "Pending")
                views.setTextColor(R.id.widget_photo_status, Color.parseColor("#F472B6"))
            }

            // Update Goal status
            views.setTextViewText(R.id.widget_goal_status, goal)
            views.setTextColor(R.id.widget_goal_status, Color.parseColor("#60A5FA"))

            // Update Streak
            views.setTextViewText(R.id.widget_streak_text, "Streak: $streak Days 🔥")

            // 1-Tap Click Intents
            // Main widget tap -> open app
            val mainIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val mainPendingIntent = PendingIntent.getActivity(
                context, 0, mainIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_root, mainPendingIntent)

            // Tap Workout column -> open exercises
            val workoutIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                data = Uri.parse("fitcoach://exercises")
            }
            val workoutPendingIntent = PendingIntent.getActivity(
                context, 1, workoutIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_col_workout, workoutPendingIntent)

            // Tap Photo column -> open snap photo check-in
            val photoIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                data = Uri.parse("fitcoach://home?action=snap-photo")
            }
            val photoPendingIntent = PendingIntent.getActivity(
                context, 2, photoIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_col_photo, photoPendingIntent)

            // Tap Goal column -> open profile
            val goalIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                data = Uri.parse("fitcoach://profile")
            }
            val goalPendingIntent = PendingIntent.getActivity(
                context, 3, goalIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_col_goal, goalPendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        fun saveWidgetDataAndRefresh(
            context: Context,
            workoutDone: Boolean,
            photoLogged: Boolean,
            streak: Int,
            goal: String
        ) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().apply {
                putBoolean("workout_done", workoutDone)
                putBoolean("photo_logged", photoLogged)
                putInt("streak", streak)
                putString("goal_status", goal)
                apply()
            }

            val intent = Intent(context, FitCoachWidgetProvider::class.java).apply {
                action = ACTION_UPDATE_WIDGET_DATA
            }
            context.sendBroadcast(intent)
        }
    }
}
