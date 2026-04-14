<?php

namespace App\Http\Controllers;

use App\Support\ResumeDocument;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class ResumePdfController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $resume = ResumeDocument::forUser($user);

        $filename = 'Resume-'.Str::slug($user->name).'.pdf';

        return Pdf::loadView('pdf.resume', ['resume' => $resume])
            ->setPaper('a4', 'portrait')
            ->setOption('isRemoteEnabled', true)
            ->stream($filename);
    }
}
