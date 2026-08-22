package model;

import java.util.Map;

public class LandForces {
    private Map<String, Integer> mainBattleTanks;
    private Map<String, Integer> armoredVehicles;
    private Map<String, Integer> selfPropelledArtillery;
    private Map<String, Integer> rocketArtillery;

    public Map<String, Integer> getMainBattleTanks() {
        return mainBattleTanks;
    }

    public void setMainBattleTanks(Map<String, Integer> mainBattleTanks) {
        this.mainBattleTanks = mainBattleTanks;
    }

    public Map<String, Integer> getArmoredVehicles() {
        return armoredVehicles;
    }

    public void setArmoredVehicles(Map<String, Integer> armoredVehicles) {
        this.armoredVehicles = armoredVehicles;
    }

    public Map<String, Integer> getSelfPropelledArtillery() {
        return selfPropelledArtillery;
    }

    public void setSelfPropelledArtillery(Map<String, Integer> selfPropelledArtillery) {
        this.selfPropelledArtillery = selfPropelledArtillery;
    }

    public Map<String, Integer> getRocketArtillery() {
        return rocketArtillery;
    }

    public void setRocketArtillery(Map<String, Integer> rocketArtillery) {
        this.rocketArtillery = rocketArtillery;
    }
}