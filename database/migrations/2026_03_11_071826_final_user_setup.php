<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::table('users', function (Blueprint $table) {
        // We check if it exists first just to be 100% safe
        if (!Schema::hasColumn('users', 'username')) {
            $table->string('username')->unique()->after('email');
        }
        if (!Schema::hasColumn('users', 'role')) {
            $table->string('role')->default('customer')->after('username');
        }
        if (!Schema::hasColumn('users', 'status')) {
            $table->string('status')->default('pending')->after('role');
        }
        if (!Schema::hasColumn('users', 'permissions')) {
            $table->json('permissions')->nullable()->after('status');
        }
    });
}

public function down(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn(['username', 'role', 'status', 'permissions']);
    });
}
};