package model;

import java.util.Map;

public class AirDefense {
    private Map<String, Integer> strategicLongRange;
    private Map<String, Integer> mediumShortRange;
    private Map<String, Integer> pointDefenseAndGun;

    public AirDefense() {}

    public Map<String, Integer> getStrategicLongRange() {
        return strategicLongRange;
    }

    public void setStrategicLongRange(Map<String, Integer> strategicLongRange) {
        this.strategicLongRange = strategicLongRange;
    }

    public Map<String, Integer> getMediumShortRange() {
        return mediumShortRange;
    }

    public void setMediumShortRange(Map<String, Integer> mediumShortRange) {
        this.mediumShortRange = mediumShortRange;
    }

    public Map<String, Integer> getPointDefenseAndGun() {
        return pointDefenseAndGun;
    }

    public void setPointDefenseAndGun(Map<String, Integer> pointDefenseAndGun) {
        this.pointDefenseAndGun = pointDefenseAndGun;
    }
}