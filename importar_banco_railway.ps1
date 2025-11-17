# Script para importar o banco SQL no Railway
# Use a URL pública do Railway (MYSQL_PUBLIC_URL)

$MYSQL_HOST = "ballast.proxy.rlwy.net"  # Substitua pela URL pública do Railway
$MYSQL_PORT = "27358"  # Substitua pela porta pública
$MYSQL_USER = "root"
$MYSQL_PASSWORD = "efEAlrmvZVAFwPbIbrYOPKQVpnqMfxMT"
$MYSQL_DATABASE = "railway"
$SQL_FILE = "conciliacao_bancaria.sql"

Write-Host "Importando banco de dados..." -ForegroundColor Green
Write-Host "Host: $MYSQL_HOST" -ForegroundColor Yellow
Write-Host "Port: $MYSQL_PORT" -ForegroundColor Yellow
Write-Host "Database: $MYSQL_DATABASE" -ForegroundColor Yellow
Write-Host ""

# Verificar se o arquivo SQL existe
if (-not (Test-Path $SQL_FILE)) {
    Write-Host "ERRO: Arquivo $SQL_FILE não encontrado!" -ForegroundColor Red
    exit 1
}

# Tentar importar usando mysql (se instalado)
if (Get-Command mysql -ErrorAction SilentlyContinue) {
    Write-Host "Importando usando mysql..." -ForegroundColor Cyan
    $env:MYSQL_PWD = $MYSQL_PASSWORD
    mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER $MYSQL_DATABASE < $SQL_FILE
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Importação concluída com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro na importação. Verifique as credenciais e a URL pública do Railway." -ForegroundColor Red
    }
} else {
    Write-Host "MySQL não está instalado localmente." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para importar, você pode:" -ForegroundColor Cyan
    Write-Host "1. Instalar MySQL e executar:" -ForegroundColor White
    Write-Host "   mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p $MYSQL_DATABASE < $SQL_FILE" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Ou usar MySQL Workbench/DBeaver:" -ForegroundColor White
    Write-Host "   - Host: $MYSQL_HOST" -ForegroundColor Gray
    Write-Host "   - Port: $MYSQL_PORT" -ForegroundColor Gray
    Write-Host "   - User: $MYSQL_USER" -ForegroundColor Gray
    Write-Host "   - Password: $MYSQL_PASSWORD" -ForegroundColor Gray
    Write-Host "   - Database: $MYSQL_DATABASE" -ForegroundColor Gray
    Write-Host "   - Abra e execute o arquivo: $SQL_FILE" -ForegroundColor Gray
}

