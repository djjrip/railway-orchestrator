import { railwayDriver, flyDriver, renderDriver, getDriver, getAllContainers } from '../src/lib/drivers';

describe('Universal Multi-Cloud Control Plane Drivers', () => {
  it('instantiates all drivers with correct provider names', () => {
    expect(railwayDriver.providerName).toBe('railway');
    expect(flyDriver.providerName).toBe('fly');
    expect(renderDriver.providerName).toBe('render');
  });

  it('resolves drivers dynamically via getDriver()', () => {
    expect(getDriver('railway')).toBe(railwayDriver);
    expect(getDriver('fly')).toBe(flyDriver);
    expect(getDriver('render')).toBe(renderDriver);
  });

  it('throws a descriptive error on unsupported providers', () => {
    // @ts-expect-error - deliberate invalid provider test
    expect(() => getDriver('unsupported_cloud')).toThrow(/Unsupported cloud provider/);
  });

  it('lists containers across sandbox environments for Railway, Fly.io, and Render', async () => {
    const railwayResult = await railwayDriver.listContainers();
    expect(railwayResult.containers.length).toBeGreaterThan(0);
    expect(railwayResult.isDemo).toBe(true);

    const flyResult = await flyDriver.listContainers();
    expect(flyResult.containers.length).toBeGreaterThan(0);
    expect(flyResult.containers[0].provider).toBe('fly');

    const renderResult = await renderDriver.listContainers();
    expect(renderResult.containers.length).toBeGreaterThan(0);
    expect(renderResult.containers[0].provider).toBe('render');
  });

  it('aggregates all fleet containers via getAllContainers()', async () => {
    const fleet = await getAllContainers();
    expect(fleet.containers.length).toBeGreaterThanOrEqual(6);
    const providers = new Set(fleet.containers.map(c => c.provider));
    expect(providers.has('railway')).toBe(true);
    expect(providers.has('fly')).toBe(true);
    expect(providers.has('render')).toBe(true);
  });

  it('fetches multi-cloud telemetry logs without error', async () => {
    const flyLogs = await flyDriver.getLogs('mock_fly_id');
    expect(flyLogs.length).toBeGreaterThan(0);
    expect(flyLogs[0].provider).toBe('fly');

    const renderLogs = await renderDriver.getLogs('mock_render_id');
    expect(renderLogs.length).toBeGreaterThan(0);
    expect(renderLogs[0].provider).toBe('render');
  });
});
