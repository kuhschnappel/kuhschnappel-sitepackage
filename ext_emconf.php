<?php

$EM_CONF[$_EXTKEY] = [
	'title' => 'Kuhschnappel Sitepackage',
	'description' => '',
	'category' => 'plugin',
	'author' => 'Mike Zimmer',
	'author_email' => 'kuhschnappel@gmail.com',
	'author_company' => '',
	'state' => 'stable',
	'uploadfolder' => NULL,
	'createDirs' => NULL,
	'clearCacheOnLoad' => true,
	'version' => '1.0.1-dev',
	'constraints' => [
		'depends' => [
            'typo3' => '11.5.0-11.5.99',
            'php' => '7.4.1-8.1.99',
        ],
        'conflicts' => [],
        'suggests' => [],
	],
	'autoload' => [
		'psr-4' => [
			'Kuhschnappel\\KuhschnappelSitepackage\\' => 'Classes'
		]
	],
];
