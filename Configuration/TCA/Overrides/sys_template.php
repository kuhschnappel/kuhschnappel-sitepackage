<?php
defined('TYPO3') or die();

call_user_func(function()
{
    $extensionKey = 'kuhschnappel_sitepackage';

    /**
     * Default TypoScript
     */
    \TYPO3\CMS\Core\Utility\ExtensionManagementUtility::addStaticFile(
        $extensionKey,
        'Configuration/TypoScript/General',
        'Site Package Configuration'
    );

    /**
     * Default TypoScript
     */
    \TYPO3\CMS\Core\Utility\ExtensionManagementUtility::addStaticFile(
        $extensionKey,
        'Configuration/TypoScript/SmartHome',
        'Site Package SmartHome Configuration'
    );

    /**
     * Default TypoScript
     */
    \TYPO3\CMS\Core\Utility\ExtensionManagementUtility::addStaticFile(
        $extensionKey,
        'Configuration/TypoScript/EmptyLayout',
        'Empty template wrapper for Json output'
    );

});
