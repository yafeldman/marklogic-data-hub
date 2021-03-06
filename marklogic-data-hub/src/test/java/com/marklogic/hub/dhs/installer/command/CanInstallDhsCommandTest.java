package com.marklogic.hub.dhs.installer.command;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.marklogic.hub.MarkLogicVersion;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class CanInstallDhsCommandTest {

    private final InstallIntoDhsCommand installIntoDhsCommand = new InstallIntoDhsCommand();

    @Test
    void testCanInstallDhs() {
        canInstall(installIntoDhsCommand.canInstallDhs("5.0.2", newMarkLogicVersion("10.0-3")));
        canInstall(installIntoDhsCommand.canInstallDhs("5.1.0", newMarkLogicVersion("10.0-4.2")));
        canInstall(installIntoDhsCommand.canInstallDhs("5.2.0", newMarkLogicVersion("10.0-5")));
        canInstall(installIntoDhsCommand.canInstallDhs("5.2.3", newMarkLogicVersion("10.0-3.1")));
        canInstall(installIntoDhsCommand.canInstallDhs("5.0.0", newMarkLogicVersion("10.0-3")));

        cantInstallInvalidDhfVersion(installIntoDhsCommand.canInstallDhs("4.0.2", newMarkLogicVersion("10.0-3")));
        cantInstallInvalidDhfVersion(installIntoDhsCommand.canInstallDhs("4.3.2", newMarkLogicVersion("10.0-4.2")));
        cantInstallInvalidDhfVersion(installIntoDhsCommand.canInstallDhs("3.0.0", newMarkLogicVersion("10.0-5")));
        cantInstallInvalidDhfVersion(installIntoDhsCommand.canInstallDhs("2.3.2", newMarkLogicVersion("9.0.0")));
        cantInstallInvalidDhfVersion(installIntoDhsCommand.canInstallDhs("4.1.0", newMarkLogicVersion("9.0-12")));

        cantInstallInvalidServerVersion(installIntoDhsCommand.canInstallDhs("5.0.2", newMarkLogicVersion("9.0-12")));
        cantInstallInvalidServerVersion(installIntoDhsCommand.canInstallDhs("5.1.0", newMarkLogicVersion("10.0-2.4")));
        cantInstallInvalidServerVersion(installIntoDhsCommand.canInstallDhs("5.2.0", newMarkLogicVersion("9.0-15")));
        cantInstallInvalidServerVersion(installIntoDhsCommand.canInstallDhs("5.2.3", newMarkLogicVersion("10.0-2")));
        cantInstallInvalidServerVersion(installIntoDhsCommand.canInstallDhs("5.0.0", newMarkLogicVersion("10.0-2.12")));

        canInstall(installIntoDhsCommand.canInstallDhs(null, newMarkLogicVersion("10.0-3")));
        canInstall(installIntoDhsCommand.canInstallDhs(null, newMarkLogicVersion("11.0-1")));
        cantInstallInvalidServerVersion(installIntoDhsCommand.canInstallDhs(null, newMarkLogicVersion("9.0.0")));
        cantInstallInvalidServerVersion(installIntoDhsCommand.canInstallDhs(null, newMarkLogicVersion("9.0-12")));
    }

    private void canInstall(ObjectNode node) {
        Assertions.assertTrue(node.get("canBeInstalled").asBoolean());
        Assertions.assertNull(node.get("message"));
    }

    private void cantInstallInvalidDhfVersion(ObjectNode node) {
        Assertions.assertFalse(node.get("canBeInstalled").asBoolean());
        Assertions.assertEquals("DHF cannot be upgraded when the major version of the existing DHF instance is 4", node.get("message").asText());
    }

    private void cantInstallInvalidServerVersion(ObjectNode node) {
        Assertions.assertFalse(node.get("canBeInstalled").asBoolean());
        Assertions.assertEquals("DHF 5.3.0 and higher require MarkLogic 10.0-3 or higher for the use of granular privileges", node.get("message").asText());
    }

    private MarkLogicVersion newMarkLogicVersion(String versionString) {
        return new MarkLogicVersion(versionString);
    }
}
