<?php

defined('TYPO3') || die();

(static function() {

    /**
     * Adding the default User TSconfig
     */
    TYPO3\CMS\Core\Utility\ExtensionManagementUtility::addUserTSConfig('
       @import "EXT:kuhschnappel_sitepackage/Configuration/TSconfig/user.tsconfig"
    ');

})();
