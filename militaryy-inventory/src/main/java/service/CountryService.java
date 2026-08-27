package service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import model.Country;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class CountryService {
    private final List<Country> countries = new ArrayList<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public CountryService() {
        loadCountries();
    }

    private void loadCountries() {
        try (InputStream inputStream = getClass().getResourceAsStream("/data/countries.json")) {
            if (inputStream != null) {
                List<Country> loaded = objectMapper.readValue(inputStream, new TypeReference<List<Country>>() {});
                this.countries.addAll(loaded);
                this.countries.sort(Comparator.comparingInt(Country::getRank));
            } else {
                System.err.println("Hata: countries.json bulunamadı!");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public List<Country> getAllCountries() {
        return countries;
    }

    public Optional<Country> getCountryById(String id) {
        return countries.stream()
                .filter(c -> c.getId().equalsIgnoreCase(id))
                .findFirst();
    }
}