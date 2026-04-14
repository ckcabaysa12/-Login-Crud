<?php

namespace App\Support;

use App\Models\User;

/**
 * Structured resume content matching the ActionLabs CV layout (sample body + user name/location).
 */
final class ResumeDocument
{
    /**
     * @return array<string, mixed>
     */
    public static function forUser(User $user): array
    {
        return [
            'brand' => [
                'company' => 'ACTIONLABS',
                'tagline' => 'Innovation in Action',
                'address' => 'Annapolis St., Greenhills, San Juan City, Quezon City, Philippines',
                'phone' => '+63 (2) 7753-7396',
                'fax' => '+63 (2) 7753-7398',
                'website' => 'www.actionlabs.com.ph',
            ],
            'candidateName' => mb_strtoupper($user->name, 'UTF-8'),
            'profile' => 'Technical support professional with extensive IT background, experienced in end-user support, '
                .'site services, digital workplace solutions, and coordinating global service delivery. Strong '
                .'communicator and team player with proven troubleshooting, documentation, and knowledge-transfer skills.',
            'skills' => [
                'Software: Adobe Photoshop, Illustrator, InDesign, After Effects, Premiere, Lightroom, Acrobat, XD, Figma, Canva.',
                'Technical: Install and configure computer systems; ticketing tools (Freshservice, ServiceNow); CCTV; '
                    .'computer networks; projectors and printers; digital signage (Raspberry Pi); conference room solutions '
                    .'(Google Meet Kit, ASUS Anvato); Windows 7/8/10 and Server 2012; AWS Workspaces; virtualization technology.',
                'Soft skills: Communication, teamwork, troubleshooting, knowledge transfer.',
            ],
            'experience' => [
                [
                    'title' => 'TEAM LEAD, END USER SUPPORT',
                    'dates' => 'Sep 2022 – Present',
                    'company' => 'Ubiquity Global Services',
                    'bullets' => [
                        'Lead end-user support and site services for enterprise clients; VIP and executive support.',
                        'Maintain service levels, incident coordination, and reporting across global systems.',
                        'Oversee personnel performance, shift coverage, and continuous improvement initiatives.',
                        'Coordinate with vendors and internal teams on hardware, software, and workplace technology.',
                        'Specialist / Digital Services Lead initiatives: work-from-home solutions, network printing, edge computing.',
                        'Projects include: MDM enrollment for India site; Aruba expansion for Eastwood site.',
                    ],
                ],
                [
                    'title' => 'TECH SUPPORT ENGINEER',
                    'dates' => 'Nov 2018 – Sep 2022',
                    'company' => 'Maximum Solutions Corp.',
                    'bullets' => [
                        'Supported IT products, network maintenance, and service request fulfillment.',
                        'Administered Active Directory, accounts, and access for corporate users.',
                        'Performed testing and rollout of new technology and security updates.',
                    ],
                ],
                [
                    'title' => 'CALL CENTER AGENT',
                    'dates' => 'Jun 2012 – Dec 2017',
                    'company' => 'Alorica Philippines',
                    'bullets' => [
                        'Handled inbound, outbound, and back-office customer queries.',
                    ],
                ],
            ],
            'education' => [
                [
                    'credential' => 'DIPLOMA IN COMPUTER ENGINEERING',
                    'institution' => 'Technology Road Technological University',
                ],
            ],
            'certificates' => [
                'TESDA Computer Systems and Servicing NCII (2018)',
                'Sophos (2019)',
                'Fujitsu Certified Engineer (2021)',
                'Epson B2B Academy (2021)',
                'TR-Ex (2022)',
                'The Complete Cyber Security Course (2023)',
                'Oracle Cloud Infrastructure (2023)',
                'Cisco Networking Academy (2023)',
            ],
            'trainings' => [
                'Sophos technical training (2019)',
                'Sangfor product training (2019–2020)',
                'Fujitsu server and storage workshops (2020–2021)',
            ],
        ];
    }
}
