const express = require("express");
const app = express();
const axios = require("axios");
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");

const pageSize = 9;

app.get("/", async (req, res) => {
  const pageNumber = parseInt(req.query.page) || 1;
  let selectedTypes = [];
  for(let key in req.query){
    if (key.startsWith('type-')){
        selectedTypes.push(key.replace("type-", ''));
    }
  }
  try {
    //fetch type
    const typesResponse = await axios.get("https://pokeapi.co/api/v2/type");
    const types = typesResponse.data.results.map((type) => type.name);
    console.log(types);

    let pokemons = [];
    if (selectedTypes && selectedTypes.length > 0) {
      const typeArray = Array.isArray(selectedTypes)
        ? selectedTypes
        : [selectedTypes];
      const promises = typeArray.map((type) =>
        axios.get(`https://pokeapi.co/api/v2/type/${type}`)
      );
      const responses = await Promise.all(promises);
      const typePokemonsPromises = responses.flatMap((response) =>
        response.data.pokemon.map((p) => axios.get(p.pokemon.url))
      );
      const pokemonDetails = await Promise.all(typePokemonsPromises);
      pokemons = pokemonDetails.map((detail) => ({
        name: detail.data.name,
        imageUrl: detail.data.sprites.front_default,
      }));
    } else {
      //all the pokemon
      const response = await axios.get(
        `https://pokeapi.co/api/v2/pokemon?limit=810`
      );
      const pokemonPromises = response.data.results.map((pokemon) =>
        axios.get(pokemon.url)
      );
      const pokemonDetails = await Promise.all(pokemonPromises);
      pokemons = pokemonDetails.map((pokemonResponse) => ({
        id: pokemonResponse.data.id,
        name: pokemonResponse.data.name,
        imageUrl: pokemonResponse.data.sprites.front_default,
      }));
    }

      //console.log(pokemons);
      // total items
      const totalPokemon = pokemons.length;
      console.log(totalPokemon);

      const startIndex = (pageNumber - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const pokemonPage = pokemons.slice(startIndex, endIndex);
      const totalPages = Math.ceil(totalPokemon / pageSize);
      console.log(totalPages);

      res.render("home", {
        pokemons: pokemonPage,
        totalPokemon,
        currentPage: pageNumber,
        totalPages,
        types,
        selectedTypes
      });
  } catch (error) {
    console.error("Failed to fetch Pokémon:", error);
    res.status(500).send("Failed to fetch data");
  }
});

app.get('/pokemon-details/:id', async (req, res) => {
    try {
      const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${req.params.id}`);
      const pokemon = response.data;
  
      
      res.render('template/pokemonDetails.ejs', {
        pokemon: pokemon});
    } catch (error) {
        console.error('Failed to fetch Pokémon details:', error);
        res.status(500).send('Error fetching Pokémon details');
      }
    });

app.use(express.static("public"));

app.listen(port, () => {
  console.log("Node application listening on port " + port);
});
