CREATE DATABASE db_import;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TIPOS ENUM
CREATE TYPE estado_carrito AS ENUM ('activo', 'completado', 'abandonado');
CREATE TYPE rol_usuario AS ENUM ('admin', 'cliente');

-- 2. TABLA USUARIOS
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_completo VARCHAR(150) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(30),
    password_hash VARCHAR(255) NOT NULL,
    rol rol_usuario NOT NULL DEFAULT 'cliente',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLA CATEGORIAS
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
);

-- 4. TABLA PRODUCTOS
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
    descuento_porcentaje NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100),
    imagen_url TEXT, -- Imagen principal de portada
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    estado BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABLA GALERÍA DE IMÁGENES (Opcional, para múltiples fotos por producto)
CREATE TABLE producto_imagenes (
    id SERIAL PRIMARY KEY,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    es_principal BOOLEAN NOT NULL DEFAULT false,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABLA INTERMEDIA: PRODUCTO_CATEGORIAS (Relación M:N)
CREATE TABLE producto_categorias (
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    categoria_id INT REFERENCES categorias(id) ON DELETE CASCADE,
    PRIMARY KEY (producto_id, categoria_id)
);

-- 7. TABLA CARRITOS
CREATE TABLE carritos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    estado estado_carrito NOT NULL DEFAULT 'activo',
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. TABLA CARRITO_ITEMS
CREATE TABLE carrito_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrito_id UUID NOT NULL REFERENCES carritos(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    cantidad INT NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_carrito_producto UNIQUE (carrito_id, producto_id)
);