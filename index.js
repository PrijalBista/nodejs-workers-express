// Scalable Express Server with favourable clusters

const cluster = require('cluster');

if (cluster.isMaster) {
    
    let numWorkers = require('os').cpus().length;
    
    for(let i=0; i<numWorkers; i++) {
        cluster.fork();  // spawn multiple clusters
    }

    // handle cluster events

    cluster.on('online', worker => {
        console.log(`Process ${worker.process.pid} is online`);
    });

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Process ${worker.process.pid} died with code ${code} and signal ${signal}`);
        console.log('Starting a new worker');
        cluster.fork();
    });

    // zero downtime implementation -> whenever master gets signal it restarts workers one by one
    
    const restartWorkers = () => {
        let workerIds = Object.keys(cluster.workers);
        
        workerIds.forEach( wid => {
            cluster.workers[wid].send({
                type: 'shutdown',
                from: 'master'
            });

            setTimeout( () => {
                if(cluster.workers[wid]) cluster.workers[wid].kill('SIGKILL');
            }, 5000);
        });
        
    }
    
    process.on("SIGUSR2", restartWorkers); // restarts when master recieves SIGUSR2 (cmd for linux$ kill -12 <pid>)

} // End of Master Code

else  {
    // client work
    const app = require('express')();
    
    app.get('/', (req, res) => {
        res.send(`Hello From Process ${process.pid} =)`).end();
    });

    server = app.listen(8000, () => {
        console.log(`Process ${process.pid} listening to all incoming requests`);
    });
    
    process.on('message', message => {
        if(message.type ==='shutdown') {
           process.exit(0); 
        }
    });
}

