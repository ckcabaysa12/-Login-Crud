<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Resume — {{ $resume['candidateName'] }}</title>
    <style>
        @page { margin: 14mm 16mm 22mm 16mm; }

        * { box-sizing: border-box; }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 9pt;
            line-height: 1.35;
            color: #1a1a1a;
            margin: 0;
            padding: 0;
        }

        .pdf-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 28mm;
            z-index: 1000;
        }

        .pdf-header-inner {
            width: 100%;
            border-collapse: collapse;
        }

        .pdf-header-inner td { vertical-align: top; padding: 0; }

        .brand-bars {
            border-collapse: collapse;
            height: 22mm;
        }

        .brand-bars td {
            padding: 0;
            vertical-align: top;
        }

        .brand-maroon { background: #7d1b32; width: 10mm; }
        .brand-navy { background: #1a2d5c; width: 32mm; }

        .logo-block {
            text-align: right;
            padding-top: 2mm;
            padding-right: 2mm;
        }

        .logo-icon {
            display: inline-block;
            vertical-align: middle;
            margin-right: 3mm;
        }

        .logo-text {
            display: inline-block;
            vertical-align: middle;
            text-align: left;
        }

        .logo-text .name {
            font-size: 14pt;
            font-weight: bold;
            color: #1a2d5c;
            letter-spacing: 0.5px;
        }

        .logo-text .name span { color: #c41e3a; }

        .logo-text .sub {
            font-size: 6.5pt;
            color: #555;
            margin-top: 1px;
        }

        .watermark {
            position: fixed;
            top: 38%;
            left: 50%;
            margin-left: -45mm;
            margin-top: -35mm;
            width: 90mm;
            height: 90mm;
            opacity: 0.06;
            z-index: 0;
            pointer-events: none;
        }

        .pdf-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 18mm;
            font-size: 7pt;
            color: #333;
            border-top: 0.4pt solid #999;
            padding-top: 2mm;
            z-index: 1000;
            background: #fff;
        }

        .footer-bar-table {
            width: 100%;
            height: 3mm;
            margin-top: 1.5mm;
            border-collapse: collapse;
        }

        .footer-bar-table td { padding: 0; height: 3mm; }
        .footer-maroon { background: #7d1b32; width: 38%; }
        .footer-navy { background: #1a2d5c; }

        .footer-lines {
            text-align: center;
            line-height: 1.45;
        }

        .content {
            position: relative;
            z-index: 1;
            padding-top: 30mm;
        }

        h1.name {
            font-size: 16pt;
            font-weight: bold;
            letter-spacing: 0.5px;
            margin: 0 0 4mm 0;
            color: #000;
        }

        .section-title {
            font-size: 9.5pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin: 4mm 0 2mm 0;
            color: #1a2d5c;
            border-bottom: 0.5pt solid #ccc;
            padding-bottom: 1mm;
        }

        .profile-text {
            text-align: justify;
            margin-bottom: 3mm;
        }

        ul.skills, ul.bullets, ul.certs {
            margin: 0 0 3mm 0;
            padding-left: 4mm;
        }

        ul.skills li, ul.bullets li, ul.certs li {
            margin-bottom: 1.5mm;
        }

        .job-block {
            margin-bottom: 4mm;
            page-break-inside: avoid;
        }

        .job-head {
            width: 100%;
            margin-bottom: 1mm;
        }

        .job-head td { vertical-align: top; }

        .job-title {
            font-weight: bold;
            font-size: 9pt;
            text-transform: uppercase;
        }

        .job-dates {
            text-align: right;
            font-size: 8.5pt;
            white-space: nowrap;
        }

        .company {
            font-style: italic;
            font-size: 8.5pt;
            margin-bottom: 1.5mm;
            color: #333;
        }

        .page-break {
            page-break-before: always;
        }

        .edu-line {
            margin-bottom: 2mm;
        }

        .edu-cred {
            font-weight: bold;
        }
    </style>
</head>
<body>

{{-- Fixed header --}}
<div class="pdf-header">
    <table class="pdf-header-inner" cellspacing="0" cellpadding="0">
        <tr>
            <td style="width: 45mm;">
                <table class="brand-bars" cellspacing="0" cellpadding="0">
                    <tr>
                        <td class="brand-maroon"></td>
                        <td class="brand-navy"></td>
                    </tr>
                </table>
            </td>
            <td>
                <div class="logo-block">
                    <span class="logo-icon">
                        <svg width="28" height="32" viewBox="0 0 28 32" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#1a2d5c" d="M2 2 L14 30 L26 2 L18 2 L14 14 L10 2 Z"/>
                            <path fill="#c41e3a" d="M8 2 L14 18 L20 2 Z" opacity="0.95"/>
                        </svg>
                    </span>
                    <div class="logo-text">
                        <div class="name">ACTION<span>LABS</span></div>
                        <div class="sub">{{ $resume['brand']['tagline'] }}</div>
                    </div>
                </div>
            </td>
        </tr>
    </table>
</div>

{{-- Watermark --}}
<div class="watermark">
    <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <text x="50" y="58" text-anchor="middle" font-size="72" font-weight="bold" fill="#1a2d5c" font-family="DejaVu Sans, sans-serif">A</text>
    </svg>
</div>

{{-- Footer every page --}}
<div class="pdf-footer">
    <div class="footer-lines">
        {{ $resume['brand']['address'] }}<br/>
        Tel: {{ $resume['brand']['phone'] }} &nbsp;|&nbsp; Fax: {{ $resume['brand']['fax'] }} &nbsp;|&nbsp; {{ $resume['brand']['website'] }}
    </div>
    <table class="footer-bar-table" cellspacing="0" cellpadding="0">
        <tr>
            <td class="footer-maroon"></td>
            <td class="footer-navy"></td>
        </tr>
    </table>
</div>

<div class="content">

    <h1 class="name">{{ $resume['candidateName'] }}</h1>

    <div class="section-title">Profile</div>
    <p class="profile-text">{{ $resume['profile'] }}</p>

    <div class="section-title">Skills</div>
    <ul class="skills">
        @foreach ($resume['skills'] as $line)
            <li>{{ $line }}</li>
        @endforeach
    </ul>

    <div class="section-title">Professional Experience</div>

    @foreach ($resume['experience'] as $index => $job)
        @if ($index === 1)
            <div class="page-break"></div>
        @endif
        <div class="job-block">
            <table class="job-head" cellspacing="0" cellpadding="0">
                <tr>
                    <td class="job-title">{{ $job['title'] }}</td>
                    <td class="job-dates">{{ $job['dates'] }}</td>
                </tr>
            </table>
            <div class="company">{{ $job['company'] }}</div>
            <ul class="bullets">
                @foreach ($job['bullets'] as $b)
                    <li>{{ $b }}</li>
                @endforeach
            </ul>
        </div>
    @endforeach

    <div class="page-break"></div>

    <div class="section-title">Educational Credentials / Certificates</div>
    @foreach ($resume['education'] as $edu)
        <div class="edu-line">
            <span class="edu-cred">{{ $edu['credential'] }}</span> — {{ $edu['institution'] }}
        </div>
    @endforeach

    <div style="margin-top:3mm; font-weight:bold; font-size:8.5pt;">Certificates</div>
    <ul class="certs">
        @foreach ($resume['certificates'] as $c)
            <li>{{ $c }}</li>
        @endforeach
    </ul>

    <div style="margin-top:2mm; font-weight:bold; font-size:8.5pt;">Trainings</div>
    <ul class="certs">
        @foreach ($resume['trainings'] as $t)
            <li>{{ $t }}</li>
        @endforeach
    </ul>

</div>

</body>
</html>
