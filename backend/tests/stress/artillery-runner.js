const { exec } = require('child_process');
const { app } = require('../../src/server');
const path = require('path');

async function runStressTest() {
  console.log('🚀 Iniciando pruebas de estrés con Artillery...');

  return new Promise((resolve, reject) => {
    // Usar el archivo .js en lugar de .yml
    const configPath = path.join(__dirname, 'stress-test.config.js');
    const reportPath = path.join(__dirname, 'artillery-report.json');
    
    const artilleryCommand = `npx artillery run ${configPath} --output ${reportPath}`;
    
    console.log(`📋 Ejecutando: ${artilleryCommand}\n`);

    const artilleryProcess = exec(artilleryCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error ejecutando Artillery:', error);
        reject(error);
        return;
      }

      console.log('📊 SALIDA DE ARTILLERY:');
      console.log('======================\n');
      console.log(stdout);

      if (stderr) {
        console.log('⚠️  ERRORES:');
        console.log(stderr);
      }

      // Generar reporte HTML
      generateHTMLReport()
        .then(() => {
          // Parsear resultados
          try {
            const fs = require('fs');
            if (fs.existsSync(reportPath)) {
              const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
              const summary = report.aggregate;
              
              console.log('\n🎯 RESULTADOS DE PRUEBAS DE ESTRÉS:');
              console.log('===================================');
              console.log(`✅ Escenarios completados: ${summary.scenariosCompleted}`);
              console.log(`❌ Escenarios fallidos: ${summary.scenariosFailed}`);
              console.log(`📈 Requests por segundo: ${summary.rps.mean}`);
              console.log(`⏱️  Latencia promedio: ${summary.latency.mean}ms`);
              console.log(`🔴 Latencia máxima: ${summary.latency.max}ms`);
              console.log(`🟡 Latencia p95: ${summary.latency.p95}ms`);
              
              // Análisis de resultados
              if (summary.latency.mean > 1000) {
                console.warn('⚠️  Latencia promedio muy alta (>1000ms)');
              }
              
              if (summary.scenariosFailed > 0) {
                const failureRate = summary.scenariosFailed / summary.scenariosCompleted;
                console.log(`📉 Tasa de fallos: ${(failureRate * 100).toFixed(2)}%`);
                
                if (failureRate > 0.05) {
                  console.warn('⚠️  Demasiados requests fallidos (>5%)');
                }
              }
              
              resolve(summary);
            } else {
              console.log('⚠️  No se encontró el archivo de reporte');
              resolve({});
            }
          } catch (parseError) {
            console.log('⚠️  No se pudo parsear el reporte:', parseError);
            resolve({});
          }
        })
        .catch(reportError => {
          console.log('⚠️  Error generando reporte:', reportError);
          resolve({});
        });
    });

    // Mostrar output en tiempo real
    artilleryProcess.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    artilleryProcess.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}

async function generateHTMLReport() {
  return new Promise((resolve, reject) => {
    console.log('\n📈 Generando reporte HTML...');
    
    const reportPath = path.join(__dirname, 'artillery-report.json');
    const htmlReportPath = path.join(__dirname, 'artillery-report.html');
    
    const reportCommand = `npx artillery report ${reportPath} --output ${htmlReportPath}`;
    
    exec(reportCommand, (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Error generando reporte HTML:', error);
        reject(error);
        return;
      }
      
      console.log('✅ Reporte HTML generado: tests/stress/artillery-report.html');
      resolve();
    });
  });
}

module.exports = { runStressTest };

// Ejecutar directamente si es el archivo principal
if (require.main === module) {
  const PORT = 5001;
  const server = app.listen(PORT, async () => {
    console.log(`🛠️  Servidor de pruebas iniciado en puerto ${PORT}`);
    console.log('⏳ Esperando 2 segundos para asegurar que el servidor esté listo...\n');
    
    // Pequeña pausa para asegurar que el servidor esté listo
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      await runStressTest();
      console.log('\n🎉 PRUEBAS DE ESTRÉS COMPLETADAS EXITOSAMENTE');
    } catch (error) {
      console.error('\n💥 ERROR EJECUTANDO PRUEBAS DE ESTRÉS:', error);
    } finally {
      server.close(() => {
        console.log('🔒 Servidor cerrado');
        process.exit(0);
      });
    }
  });
}