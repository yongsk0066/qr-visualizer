use wasm_bindgen::prelude::*;

const FIELD_SIZE: u16 = 256;
const PRIMITIVE_POLYNOMIAL: u16 = 0x11d;

static mut EXP_TABLE: [u16; 256] = [0; 256];
static mut LOG_TABLE: [u16; 256] = [0; 256];
static mut INIT: bool = false;

fn init_tables() {
    unsafe {
        if INIT { return; }
        INIT = true;
        let mut x: u16 = 1;
        for i in 0..255 {
            EXP_TABLE[i] = x;
            LOG_TABLE[x as usize] = i as u16;
            x = shift_with_primitive(x);
        }
        EXP_TABLE[255] = EXP_TABLE[0];
    }
}

fn shift_with_primitive(x: u16) -> u16 {
    let y = x << 1;
    if y >= FIELD_SIZE { y ^ PRIMITIVE_POLYNOMIAL } else { y }
}

fn gf_multiply(a: u16, b: u16) -> u16 {
    if a == 0 || b == 0 { return 0; }
    unsafe {
        init_tables();
        let exp = ((LOG_TABLE[a as usize] as usize + LOG_TABLE[b as usize] as usize) % 255) as usize;
        EXP_TABLE[exp]
    }
}

fn gf_exp(i: usize) -> u16 {
    unsafe {
        init_tables();
        EXP_TABLE[i % 255]
    }
}

fn multiply_polynomials(a: &[u16], b: &[u16]) -> Vec<u16> {
    let mut result = vec![0u16; a.len() + b.len() - 1];
    for i in 0..a.len() {
        for j in 0..b.len() {
            result[i + j] ^= gf_multiply(a[i], b[j]);
        }
    }
    result
}

fn divide_polynomial(dividend: &[u16], generator: &[u16]) -> Vec<u16> {
    let mut result = dividend.to_vec();
    for i in 0..=dividend.len() - generator.len() {
        let coefficient = result[i];
        if coefficient != 0 {
            for j in 0..generator.len() {
                result[i + j] ^= gf_multiply(generator[j], coefficient);
            }
        }
    }
    result
}

#[wasm_bindgen]
pub fn create_generator_polynomial(degree: usize) -> Vec<u16> {
    let mut result = vec![1u16];
    for i in 0..degree {
        result = multiply_polynomials(&result, &[1, gf_exp(i)]);
    }
    result
}

#[wasm_bindgen]
pub fn generate_error_correction_codewords(data: &[u16], ec_count: usize) -> Vec<u16> {
    let generator = create_generator_polynomial(ec_count);
    let mut padded = Vec::with_capacity(data.len() + ec_count);
    padded.extend_from_slice(data);
    padded.extend(std::iter::repeat(0u16).take(ec_count));
    let remainder = divide_polynomial(&padded, &generator);
    remainder[data.len()..].to_vec()
}
