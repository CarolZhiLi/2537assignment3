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
    //console.log(types);

    let pokemons = [];
    if (selectedTypes.length > 0) {
      const typePromises = selectedTypes.map(type =>
        axios.get(`https://pokeapi.co/api/v2/type/${type}`)
      );
      const typeResponses = await Promise.all(typePromises);
      const typePokemons = typeResponses.map(response => response.data.pokemon.map(p => p.pokemon.name));

      // Intersection of all arrays
      const commonPokemons = typePokemons.reduce((acc, cur) => 
        acc.filter(name => cur.includes(name))
      );
      // Fetch details for the common Pokémon
      const pokemonDetailsPromises = commonPokemons.map(pokemonName =>
        axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`)
      );
      const pokemonDetailsResponses = await Promise.all(pokemonDetailsPromises);
      pokemons = pokemonDetailsResponses.map(detail => ({
        id: detail.data.id,
        name: detail.data.name,
        imageUrl: detail.data.sprites.front_default,
      }));    
    //console.log(pokemons); 

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
      //console.log(pokemons);
      //console.log(pokemons[1].imageUrl);
    }

      //console.log(pokemons);
      // total items
      const totalPokemon = pokemons.length;
      //console.log(totalPokemon);

      const startIndex = (pageNumber - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const pokemonPage = pokemons.slice(startIndex, endIndex);
      const totalPages = Math.ceil(totalPokemon / pageSize);
      //console.log(totalPages);

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
    console.log("Requested Pokémon ID:", req.params.id);
    try {
      const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${req.params.id}/`);
      const pokemon = response.data;
      //console.log(pokemon);
      //console.log(pokemon.sprites.front_default);
      
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
