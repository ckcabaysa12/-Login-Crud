<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API routes (optional). Session-authenticated JSON lives under web.php as
| /api/users so cookies and CSRF work with the same-origin SPA.
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->get('/user', function (\Illuminate\Http\Request $request) {
    return $request->user();
});
