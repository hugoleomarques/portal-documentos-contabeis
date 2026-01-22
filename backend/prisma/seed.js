const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed do banco de dados...');

    // 1. Criar usuário admin da contabilidade
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.usuario.upsert({
        where: { email: 'admin@contabilidade.com' },
        update: {},
        create: {
            email: 'admin@contabilidade.com',
            senha: adminPassword,
            nome: 'Administrador',
            tipo: 'ADMIN_CONTABILIDADE',
            ativo: true
        }
    });
    console.log('✅ Admin criado:', admin.email);

    // 2. Criar empresas de exemplo
    const empresas = [];
    for (let i = 1; i <= 5; i++) {
        const cnpj = String(i).padStart(14, '0');
        const empresa = await prisma.empresa.upsert({
            where: { cnpj },
            update: {},
            create: {
                cnpj,
                razaoSocial: `Empresa Exemplo ${i} LTDA`,
                nomeFantasia: `Empresa ${i}`,
                email: `contato@empresa${i}.com.br`,
                telefone: `1199999999${i}`,
                ativo: true
            }
        });
        empresas.push(empresa);
        console.log(`✅ Empresa criada: ${empresa.razaoSocial}`);
    }

    // 3. Criar usuários para cada empresa
    for (const empresa of empresas) {
        const senhaHash = await bcrypt.hash('senha123', 12);

        // Sócio
        await prisma.usuario.upsert({
            where: { email: `socio@${empresa.cnpj}.com` },
            update: {},
            create: {
                email: `socio@${empresa.cnpj}.com`,
                senha: senhaHash,
                nome: `Sócio ${empresa.razaoSocial}`,
                tipo: 'SOCIO',
                empresaId: empresa.id,
                ativo: true
            }
        });

        // RH
        await prisma.usuario.upsert({
            where: { email: `rh@${empresa.cnpj}.com` },
            update: {},
            create: {
                email: `rh@${empresa.cnpj}.com`,
                senha: senhaHash,
                nome: `RH ${empresa.razaoSocial}`,
                tipo: 'RH',
                empresaId: empresa.id,
                ativo: true
            }
        });

        console.log(`✅ Usuários criados para ${empresa.razaoSocial}`);
    }

    // 4. Criar consentimentos LGPD
    const usuarios = await prisma.usuario.findMany({
        where: { empresaId: { not: null } }
    });

    for (const usuario of usuarios) {
        await prisma.consentimento.create({
            data: {
                usuarioId: usuario.id,
                empresaId: usuario.empresaId,
                versaoTermos: '1.0',
                aceito: true,
                ipAddress: '127.0.0.1'
            }
        });
    }
    console.log('✅ Consentimentos LGPD criados');

    console.log('\n🎉 Seed concluído com sucesso!');
    console.log('\n📝 Credenciais de teste:');
    console.log('Admin: admin@contabilidade.com / admin123');
    console.log('Sócio Empresa 1: socio@00000000000001.com / senha123');
    console.log('RH Empresa 1: rh@00000000000001.com / senha123');
}

main()
    .catch((e) => {
        console.error('❌ Erro no seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
