import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { OptionListService } from '../option-list-service';
import { OptionListItem } from '../../types/option-list';

describe('OptionListService', () => {
  const mock = new MockAdapter(axios);
  const testType = 'referral-types';
  const testData: OptionListItem[] = [
    { value: 1, label: 'Type A' },
    { value: 2, label: 'Type B' },
  ];

  afterEach(() => {
    mock.reset();
    OptionListService.clearCache();
  });

  it('fetches option list items from API', async () => {
    mock.onGet(`/api/optionlistitems/${testType}`).reply(200, testData);
    const result = await OptionListService.fetchOptionList(testType);
    expect(result).toEqual(testData);
  });

  it('caches option list items', async () => {
    mock.onGet(`/api/optionlistitems/${testType}`).reply(200, testData);
    await OptionListService.fetchOptionList(testType);
    mock.onGet(`/api/optionlistitems/${testType}`).reply(500);
    const result = await OptionListService.fetchOptionList(testType);
    expect(result).toEqual(testData); // Should return cached result
  });

  it('clears cache', async () => {
    mock.onGet(`/api/optionlistitems/${testType}`).reply(200, testData);
    await OptionListService.fetchOptionList(testType);
    OptionListService.clearCache();
    mock.onGet(`/api/optionlistitems/${testType}`).reply(200, []);
    const result = await OptionListService.fetchOptionList(testType);
    expect(result).toEqual([]);
  });
});
