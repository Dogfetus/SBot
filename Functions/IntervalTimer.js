import random from "../Utils/random.js";
import { scoreFeedEmbed } from '../Commands/Embeds.js';
import scoreFeedElement from '../Stepmania/Classes/ScoreFeedElement.js';
import { GetHistory } from '../Stepmania/Stepmaniax.js';
import iso8061ToEpoch from '../Utils/iso8601Time.js';
import register, {lastUpdate, updateTime} from '../config.js'



export default async function startInterval(client, time) {

    let historyJson = await GetHistory();
    let embeds = [];
    
    console.log("sending: " + time);



    // loops through the json data from stempaniax and creates an embed for each entry (stops at 10 entries)
    for (let index = 0; (index < historyJson.history.length) && (embeds.length < 10); index++) {
            let scorefeed = new scoreFeedElement();
            scorefeed.parseJsonToValues(historyJson, index); 

            if (lastUpdate && iso8061ToEpoch(lastUpdate) >= iso8061ToEpoch(scorefeed.created_at))
                break;
            else 
                embeds.push(scoreFeedEmbed(scorefeed));
    }





    // if the scorefeed has any new entries
    if (embeds.length > 0){

        // update the last recorded value to the last item in the score feed
        console.log(lastUpdate);
        updateTime(historyJson.history[0].created_at);


        // then we loop through each guild and send the new embeds
        for (const [guildid, config] of register) {
            // if guild has disabled the bot            
            if (!config.enabled) continue;
            
            try {
                console.log(`Sending message to channel ${config.channel}`);
                const channel = await client.channels.fetch(config.channel);
                await channel.send({embeds: embeds});
            } catch (error) {
                console.error(`Failed to send message to channel ${config.channel}: ${error}`);
            }
        }
    }

    setTimeout(async () => {
        await startInterval(client, random(28000, 42000)); // Recursively schedule the next execution (28 - 42 sek)
    }, time);

    console.log("Next update in: " + time);
};
