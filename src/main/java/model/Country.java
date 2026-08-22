package model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Country {
    private int rank;
    private String id;
    private String name;
    private String flagCode;
    private int activePersonnel;
    private LandForces landForces;
    private AirForces airForces;
    private NavalForces navalForces;
    private AirDefense airDefense;

    public Country() {}

    public int getRank() {
        return rank;
    }

    public void setRank(int rank) {
        this.rank = rank;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getFlagCode() {
        return flagCode;
    }

    public void setFlagCode(String flagCode) {
        this.flagCode = flagCode;
    }

    public int getActivePersonnel() {
        return activePersonnel;
    }

    public void setActivePersonnel(int activePersonnel) {
        this.activePersonnel = activePersonnel;
    }

    public LandForces getLandForces() {
        return landForces;
    }

    public void setLandForces(LandForces landForces) {
        this.landForces = landForces;
    }

    public AirForces getAirForces() {
        return airForces;
    }

    public void setAirForces(AirForces airForces) {
        this.airForces = airForces;
    }

    public NavalForces getNavalForces() {
        return navalForces;
    }

    public void setNavalForces(NavalForces navalForces) {
        this.navalForces = navalForces;
    }

    public AirDefense getAirDefense() {
        return airDefense;
    }

    public void setAirDefense(AirDefense airDefense) {
        this.airDefense = airDefense;
    }
}