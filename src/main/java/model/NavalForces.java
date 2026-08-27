package model;

import java.util.Map;

public class NavalForces {
    private Map<String, Integer> aircraftCarriers;     // Uçak & Amfibi Hücum Gemileri (LHD/CVN)
    private Map<String, Integer> submarines;           // Denizaltılar (SSN, SSBN, AIP)
    private Map<String, Integer> destroyersAndFrigates;// Muhrip ve Fırkateynler
    private Map<String, Integer> corvettesAndPatrol;   // Korvetler ve Hücumbotlar

    public Map<String, Integer> getAircraftCarriers() { return aircraftCarriers; }
    public void setAircraftCarriers(Map<String, Integer> aircraftCarriers) { this.aircraftCarriers = aircraftCarriers; }

    public Map<String, Integer> getSubmarines() { return submarines; }
    public void setSubmarines(Map<String, Integer> submarines) { this.submarines = submarines; }

    public Map<String, Integer> getDestroyersAndFrigates() { return destroyersAndFrigates; }
    public void setDestroyersAndFrigates(Map<String, Integer> destroyersAndFrigates) { this.destroyersAndFrigates = destroyersAndFrigates; }

    public Map<String, Integer> getCorvettesAndPatrol() { return corvettesAndPatrol; }
    public void setCorvettesAndPatrol(Map<String, Integer> corvettesAndPatrol) { this.corvettesAndPatrol = corvettesAndPatrol; }
}