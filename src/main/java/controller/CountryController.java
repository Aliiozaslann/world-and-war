package controller;

import model.Country;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import service.CountryService;

import java.util.List;

@RestController
@RequestMapping("/api/countries")
@CrossOrigin(origins = "*")
public class CountryController {

    private final CountryService countryService;

    public CountryController(CountryService countryService) {
        this.countryService = countryService;
    }

    // Tüm ülkelerin listesini döner: GET http://localhost:8080/api/countries
    @GetMapping
    public List<Country> getAllCountries() {
        return countryService.getAllCountries();
    }

    // Tek bir ülkenin detayını döner: GET http://localhost:8080/api/countries/turkey
    @GetMapping("/{id}")
    public ResponseEntity<Country> getCountryById(@PathVariable String id) {
        return countryService.getCountryById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}