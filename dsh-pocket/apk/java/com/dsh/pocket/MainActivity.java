package com.dsh.pocket;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

/**
 * Fullscreen WebView shell for DSH Pocket (pocket.starroute.me).
 * Zero androidx dependencies: plain android.* only, built with the manual
 * aapt2/javac/d8/zipalign/apksigner chain (no Gradle).
 *
 * - Cookies + DOM storage persist, so the access PIN is entered once.
 * - Back key walks web history first, then double-tap to exit.
 * - Links leaving the tunnel host open in the system browser.
 */
public class MainActivity extends Activity {
    private static final String HOME_URL = "https://pocket.starroute.me";
    private static final String HOME_HOST = "pocket.starroute.me";
    private static final long DOUBLE_BACK_EXIT_MS = 2200L;
    private static final int VERSION_CODE = 3; // bump to trigger a one-shot cache wipe on first launch

    private WebView web;
    private long lastBackAt = 0L;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        web = new WebView(this);
        // One-shot cache wipe on app upgrade: the shell serves the same URL for
        // its client bundle, so a stale WebView cache would keep the old page
        // alive across app updates. Wipe once per new versionCode, then let the
        // normal cache policy take over.
        android.content.SharedPreferences prefs = getPreferences(MODE_PRIVATE);
        if (prefs.getInt("lastVersionCode", 0) != VERSION_CODE) {
            web.clearCache(true);
            prefs.edit().putInt("lastVersionCode", VERSION_CODE).apply();
        }
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setDatabaseEnabled(true);
        web.getSettings().setAllowFileAccess(false);
        web.getSettings().setAllowContentAccess(false);
        web.getSettings().setSupportZoom(false);

        CookieManager cm = CookieManager.getInstance();
        cm.setAcceptCookie(true);
        cm.setAcceptThirdPartyCookies(web, true);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                String scheme = url.getScheme() == null ? "" : url.getScheme();
                // Keep tunnel traffic in-app; hand anything else to the system.
                if (("https".equals(scheme) || "http".equals(scheme))
                        && HOME_HOST.equals(url.getHost())) {
                    return false;
                }
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, url));
                } catch (Exception ignored) {
                }
                return true;
            }
        });

        setContentView(web);

        if (savedInstanceState != null) {
            web.restoreState(savedInstanceState);
        } else {
            web.loadUrl(HOME_URL);
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    protected void onPause() {
        super.onPause();
        // Persist cookies immediately so the PIN survives process death.
        CookieManager.getInstance().flush();
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) {
            web.goBack();
            return;
        }
        long now = System.currentTimeMillis();
        if (now - lastBackAt < DOUBLE_BACK_EXIT_MS) {
            super.onBackPressed();
            return;
        }
        lastBackAt = now;
        Toast.makeText(this, "再按一次退出", Toast.LENGTH_SHORT).show();
    }
}
