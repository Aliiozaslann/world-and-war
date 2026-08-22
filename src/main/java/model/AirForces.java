package model;

import java.util.Map;

public class AirForces {
    private Map<String, Integer> fighterAircraft;      // Av / Muharebe Uçakları
    private Map<String, Integer> attackHelicopters;    // Taarruz Helikopterleri
    private Map<String, Integer> ucavAndDrones;        // SİHA ve İHA'lar
    private Map<String, Integer> transportAndTanker;   // Nakliye ve Tanker Uçakları

    public Map<String, Integer> getFighterAircraft() { return fighterAircraft; }
    public void setFighterAircraft(Map<String, Integer> fighterAircraft) { this.fighterAircraft = fighterAircraft; }

    public Map<String, Integer> getAttackHelicopters() { return attackHelicopters; }
    public void setAttackHelicopters(Map<String, Integer> attackHelicopters) { this.attackHelicopters = attackHelicopters; }

    public Map<String, Integer> getUcavAndDrones() { return ucavAndDrones; }
    public void setUcavAndDrones(Map<String, Integer> ucavAndDrones) { this.ucavAndDrones = ucavAndDrones; }

    public Map<String, Integer> getTransportAndTanker() { return transportAndTanker; }
    public void setTransportAndTanker(Map<String, Integer> transportAndTanker) { this.transportAndTanker = transportAndTanker; }
}